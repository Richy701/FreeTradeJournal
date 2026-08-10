//+------------------------------------------------------------------+
//| FreeTradeJournalSync.mq5                                         |
//| Pushes your closed trades to FreeTradeJournal automatically.     |
//|                                                                  |
//| Setup:                                                           |
//|  1. In FreeTradeJournal, open Settings > Broker Sync and copy    |
//|     your personal sync key.                                      |
//|  2. In MetaTrader 5: Tools > Options > Expert Advisors, tick     |
//|     "Allow WebRequest for listed URL" and add:                   |
//|       https://us-central1-tradevault-41c68.cloudfunctions.net    |
//|  3. Attach this EA to any one chart, paste the sync key into     |
//|     the SyncKey input, and keep the terminal running.            |
//|                                                                  |
//| The EA re-sends recent history on every sweep by design; the     |
//| server deduplicates by deal ticket, so nothing is ever imported  |
//| twice. Source is published so you can read exactly what it does. |
//+------------------------------------------------------------------+
#property copyright "FreeTradeJournal"
#property link      "https://www.freetradejournal.com"
#property version   "1.00"
#property strict

input string SyncKey            = "";     // Your sync key from Settings > Broker Sync
input int    SyncIntervalSecs   = 5;      // How often to check for new closed trades
input int    FullSweepMinutes   = 10;     // Full catch-up sweep interval
input bool   BackfillAllHistory = true;   // Send full account history on first run

string  SYNC_URL = "https://us-central1-tradevault-41c68.cloudfunctions.net/mtSyncPush";
#define MAX_DEALS_PER_POST 100
#define OVERLAP_SECONDS    86400  // re-scan the last day each sweep; server dedupes

bool     g_dirty = true;          // work pending (set by OnTradeTransaction)
datetime g_lastFullSweep = 0;
string   g_bookmarkVar = "";      // GlobalVariable persisting last synced close time

//+------------------------------------------------------------------+
int OnInit()
  {
   if(StringLen(SyncKey) < 20)
     {
      Comment("FreeTradeJournal Sync: paste your sync key into the EA inputs.\n",
              "Get it from Settings > Broker Sync at freetradejournal.com");
      Print("FTJ Sync: SyncKey input is empty — open the EA inputs and paste your key.");
     }
   g_bookmarkVar = "FTJSync_" + (string)AccountInfoInteger(ACCOUNT_LOGIN);
   EventSetTimer(MathMax(SyncIntervalSecs, 2));
   Print("FTJ Sync: started for account ", AccountInfoInteger(ACCOUNT_LOGIN),
         " on ", AccountInfoString(ACCOUNT_SERVER));
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   EventKillTimer();
   Comment("");
  }

//+------------------------------------------------------------------+
//| Never call WebRequest from here — the transaction queue can drop |
//| entries if a handler is slow. Just mark that a sweep is needed.  |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest &request,
                        const MqlTradeResult &result)
  {
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD)
      g_dirty = true;
  }

//+------------------------------------------------------------------+
void OnTimer()
  {
   if(StringLen(SyncKey) < 20)
      return;

   bool fullSweep = (TimeCurrent() - g_lastFullSweep) >= FullSweepMinutes * 60;
   if(!g_dirty && !fullSweep)
      return;

   if(SweepAndPush())
     {
      g_dirty = false;
      if(fullSweep)
         g_lastFullSweep = TimeCurrent();
     }
  }

//+------------------------------------------------------------------+
//| Scan closed deals since the bookmark and push them in batches.   |
//| Returns true when every batch was accepted by the server.        |
//+------------------------------------------------------------------+
bool SweepAndPush()
  {
   datetime from = 0;
   if(GlobalVariableCheck(g_bookmarkVar))
      from = (datetime)((long)GlobalVariableGet(g_bookmarkVar)) - OVERLAP_SECONDS;
   else if(!BackfillAllHistory)
      from = TimeCurrent() - OVERLAP_SECONDS;
   if(from < 0)
      from = 0;

   if(!HistorySelect(from, TimeCurrent() + 3600))
     {
      Print("FTJ Sync: HistorySelect failed");
      return(false);
     }

   // Pass 1: collect the closing (OUT) deals in range.
   ulong outTickets[];
   int total = HistoryDealsTotal();
   for(int i = 0; i < total; i++)
     {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0)
         continue;
      long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      long type  = HistoryDealGetInteger(ticket, DEAL_TYPE);
      if(entry != DEAL_ENTRY_OUT && entry != DEAL_ENTRY_OUT_BY)
         continue;
      if(type != DEAL_TYPE_BUY && type != DEAL_TYPE_SELL)
         continue; // skip balance/credit operations
      int n = ArraySize(outTickets);
      ArrayResize(outTickets, n + 1);
      outTickets[n] = ticket;
     }

   int count = ArraySize(outTickets);
   if(count == 0)
      return(true);

   // Pass 2: build one JSON row per closing deal and push in batches.
   datetime maxClose = 0;
   string rows = "";
   int inBatch = 0;
   for(int i = 0; i < count; i++)
     {
      string row = BuildDealJson(outTickets[i]);
      if(row == "")
         continue;
      datetime closeT = (datetime)HistoryDealGetInteger(outTickets[i], DEAL_TIME);
      if(closeT > maxClose)
         maxClose = closeT;
      rows += (inBatch > 0 ? "," : "") + row;
      inBatch++;
      if(inBatch >= MAX_DEALS_PER_POST || i == count - 1)
        {
         if(!PostBatch(rows, inBatch))
            return(false);
         rows = "";
         inBatch = 0;
        }
     }

   if(maxClose > 0)
      GlobalVariableSet(g_bookmarkVar, (double)(long)maxClose);
   Comment("FreeTradeJournal Sync: OK\nLast sync: ", TimeToString(TimeCurrent(), TIME_DATE|TIME_MINUTES|TIME_SECONDS),
           "\nDeals in range: ", count);
   return(true);
  }

//+------------------------------------------------------------------+
//| One closing deal -> one JSON object. The closing deal's type is  |
//| opposite to the position's direction (a SELL deal closes a BUY). |
//| Entry price/time are aggregated across the position's IN deals   |
//| (volume-weighted), and entry commission is shared pro-rata onto  |
//| partial closes.                                                  |
//+------------------------------------------------------------------+
string BuildDealJson(ulong outTicket)
  {
   long   posId      = HistoryDealGetInteger(outTicket, DEAL_POSITION_ID);
   string symbol     = HistoryDealGetString(outTicket, DEAL_SYMBOL);
   long   outType    = HistoryDealGetInteger(outTicket, DEAL_TYPE);
   double volume     = HistoryDealGetDouble(outTicket, DEAL_VOLUME);
   double closePrice = HistoryDealGetDouble(outTicket, DEAL_PRICE);
   datetime closeT   = (datetime)HistoryDealGetInteger(outTicket, DEAL_TIME);
   double profit     = HistoryDealGetDouble(outTicket, DEAL_PROFIT);
   double swap       = HistoryDealGetDouble(outTicket, DEAL_SWAP);
   double commission = HistoryDealGetDouble(outTicket, DEAL_COMMISSION);
   string comment    = HistoryDealGetString(outTicket, DEAL_COMMENT);

   // Aggregate the position's entry side.
   double entryVol = 0, entryCost = 0, entryCommission = 0;
   datetime openT = 0;
   if(posId > 0 && HistorySelectByPosition(posId))
     {
      int n = HistoryDealsTotal();
      for(int i = 0; i < n; i++)
        {
         ulong t = HistoryDealGetTicket(i);
         if(t == 0)
            continue;
         if(HistoryDealGetInteger(t, DEAL_ENTRY) != DEAL_ENTRY_IN)
            continue;
         double v = HistoryDealGetDouble(t, DEAL_VOLUME);
         entryVol  += v;
         entryCost += v * HistoryDealGetDouble(t, DEAL_PRICE);
         entryCommission += HistoryDealGetDouble(t, DEAL_COMMISSION);
         datetime dt = (datetime)HistoryDealGetInteger(t, DEAL_TIME);
         if(openT == 0 || dt < openT)
            openT = dt;
        }
     }
   double openPrice = (entryVol > 0) ? entryCost / entryVol : 0;
   if(entryVol > 0)
      commission += entryCommission * (volume / entryVol);

   string side = (outType == DEAL_TYPE_SELL) ? "buy" : "sell";

   string json = "{";
   json += "\"ticket\":\""    + (string)outTicket + "\",";
   json += "\"positionId\":\""+ (string)posId + "\",";
   json += "\"symbol\":\""    + JsonEscape(symbol) + "\",";
   json += "\"side\":\""      + side + "\",";
   json += "\"volume\":"      + DoubleToString(volume, 2) + ",";
   json += "\"openTime\":"    + (string)(long)openT + ",";
   json += "\"closeTime\":"   + (string)(long)closeT + ",";
   json += "\"openPrice\":"   + DoubleToString(openPrice, 8) + ",";
   json += "\"closePrice\":"  + DoubleToString(closePrice, 8) + ",";
   json += "\"profit\":"      + DoubleToString(profit, 2) + ",";
   json += "\"swap\":"        + DoubleToString(swap, 2) + ",";
   json += "\"commission\":"  + DoubleToString(commission, 2) + ",";
   json += "\"comment\":\""   + JsonEscape(comment) + "\"";
   json += "}";
   return(json);
  }

//+------------------------------------------------------------------+
bool PostBatch(string rows, int dealCount)
  {
   string body = "{";
   body += "\"key\":\"" + SyncKey + "\",";
   body += "\"account\":{";
   body += "\"server\":\""   + JsonEscape(AccountInfoString(ACCOUNT_SERVER)) + "\",";
   body += "\"login\":\""    + (string)AccountInfoInteger(ACCOUNT_LOGIN) + "\",";
   body += "\"platform\":\"mt5\",";
   body += "\"currency\":\"" + JsonEscape(AccountInfoString(ACCOUNT_CURRENCY)) + "\",";
   body += "\"balance\":"    + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2);
   body += "},";
   body += "\"deals\":[" + rows + "]";
   body += "}";

   char data[], result[];
   string resultHeaders;
   int len = StringToCharArray(body, data, 0, WHOLE_ARRAY, CP_UTF8) - 1;
   if(len < 0)
      len = 0;
   ArrayResize(data, len);

   ResetLastError();
   int status = WebRequest("POST", SYNC_URL, "Content-Type: application/json\r\n",
                           10000, data, result, resultHeaders);
   if(status == -1)
     {
      int err = GetLastError();
      if(err == 4014 || err == 4060)
        {
         string msg = "FreeTradeJournal Sync: WebRequest is blocked.\n" +
                      "Fix: Tools > Options > Expert Advisors > tick 'Allow WebRequest for listed URL' and add:\n" +
                      "https://us-central1-tradevault-41c68.cloudfunctions.net\n" +
                      "Then remove and re-attach this EA.";
         Comment(msg);
         Print(msg);
        }
      else
         Print("FTJ Sync: WebRequest failed, error ", err, " (will retry)");
      return(false);
     }
   if(status != 200)
     {
      Print("FTJ Sync: server returned ", status, ": ", CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8));
      return(false);
     }
   Print("FTJ Sync: pushed ", dealCount, " deal(s)");
   return(true);
  }

//+------------------------------------------------------------------+
string JsonEscape(string s)
  {
   StringReplace(s, "\\", "\\\\");
   StringReplace(s, "\"", "\\\"");
   StringReplace(s, "\n", "\\n");
   StringReplace(s, "\r", "\\r");
   StringReplace(s, "\t", "\\t");
   return(s);
  }
//+------------------------------------------------------------------+
