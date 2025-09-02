import * as React from "react"
import { Building2, CircleDollarSign, Target, Beaker } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAccounts, type TradingAccount } from "@/contexts/account-context"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const accountTypeIcons = {
  demo: Beaker,
  live: CircleDollarSign,
  'prop-firm': Building2,
  paper: Target,
}

const accountTypeLabels = {
  demo: 'Demo',
  live: 'Live',
  'prop-firm': 'Prop Firm',
  paper: 'Paper',
}

const accountTypeColors = {
  demo: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  live: 'bg-green-500/10 text-green-600 border-green-500/20',
  'prop-firm': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  paper: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
}

interface AccountSwitcherProps {
  onManageAccounts?: () => void
}

export function AccountSwitcher({ onManageAccounts }: AccountSwitcherProps) {
  const { accounts, activeAccount, setActiveAccount } = useAccounts()

  if (!activeAccount) {
    return null
  }

  return (
    <Select
      value={activeAccount.id}
      onValueChange={(accountId) => {
        const account = accounts.find(acc => acc.id === accountId)
        if (account) {
          setActiveAccount(account)
        }
      }}
    >
      <SelectTrigger className="w-full md:w-[200px] bg-background/80 backdrop-blur-sm border-border/50">
        <SelectValue>
          <span className="truncate font-medium">{activeAccount.name}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => {
          const Icon = accountTypeIcons[account.type]
          return (
            <SelectItem key={account.id} value={account.id}>
              <div className="flex items-center gap-3 w-full">
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{account.name}</span>
                    {account.isDefault && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{account.broker}</span>
                  </div>
                </div>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}