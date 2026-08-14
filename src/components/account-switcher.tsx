import * as React from "react"
import { CaretUpDown, Check, Stack } from '@phosphor-icons/react'
import { cn } from "@/lib/utils"
import { useAccounts, type TradingAccount } from "@/contexts/account-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const accountTypeLabels = {
  demo: 'Demo',
  live: 'Live',
  'prop-firm': 'Prop Firm',
  paper: 'Paper',
}

interface AccountSwitcherProps {
  onManageAccounts?: () => void
}

export function AccountSwitcher({ onManageAccounts }: AccountSwitcherProps) {
  const { accounts, activeAccount, setActiveAccount, isAllAccounts, allAccountsCurrency, setAllAccounts } = useAccounts()
  const { isDemo } = useAuth()

  if (isDemo || !activeAccount) {
    return null
  }

  // Combined-view entries: one per currency that has 2+ accounts. No FX
  // conversion exists, so accounts are only ever combined within a currency.
  const currencies = [...new Set(accounts.map(a => a.currency))]
  const combinableCurrencies = currencies.filter(
    c => accounts.filter(a => a.currency === c).length > 1
  )
  const singleCurrency = currencies.length === 1

  const triggerLabel = isAllAccounts
    ? (singleCurrency ? 'All accounts' : `All ${allAccountsCurrency} accounts`)
    : activeAccount.name

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-11 md:h-9 justify-between px-2.5 text-sm font-medium bg-sidebar-accent/40 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <span className="truncate flex items-center gap-1.5">
            {isAllAccounts && <Stack className="h-3.5 w-3.5 shrink-0" />}
            {triggerLabel}
          </span>
          <CaretUpDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={4}
        className="w-[--radix-dropdown-menu-trigger-width] min-w-[240px] rounded-lg p-1"
      >
        {combinableCurrencies.length > 0 && (
          <>
            {combinableCurrencies.map((currency) => {
              const isActive = isAllAccounts && allAccountsCurrency === currency
              const count = accounts.filter(a => a.currency === currency).length
              return (
                <DropdownMenuItem
                  key={`all-${currency}`}
                  onClick={() => setAllAccounts(currency)}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer",
                    isActive && "bg-muted"
                  )}
                >
                  <Stack className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className={cn("text-sm truncate", isActive && "font-medium")}>
                      {singleCurrency ? 'All accounts' : `All ${currency} accounts`}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {count} accounts · view only
                    </span>
                  </div>
                  {isActive && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
          </>
        )}
        {accounts.map((account) => {
          const isActive = !isAllAccounts && account.id === activeAccount.id
          return (
            <DropdownMenuItem
              key={account.id}
              onClick={() => setActiveAccount(account)}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer",
                isActive && "bg-muted"
              )}
            >
              <div className="flex flex-col flex-1 min-w-0">
                <span className={cn("text-sm truncate", isActive && "font-medium")}>
                  {account.name}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {accountTypeLabels[account.type]}
                  {account.broker ? ` · ${account.broker}` : ''}
                </span>
              </div>
              {isActive && (
                <Check className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
