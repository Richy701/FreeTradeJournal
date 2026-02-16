import * as React from "react"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAccounts, type TradingAccount } from "@/contexts/account-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  const { accounts, activeAccount, setActiveAccount } = useAccounts()
  const { isDemo } = useAuth()

  if (isDemo || !activeAccount) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-9 justify-between px-2.5 text-sm font-medium"
        >
          <span className="truncate">{activeAccount.name}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={4}
        className="w-[--radix-dropdown-menu-trigger-width] min-w-[200px] rounded-lg p-1"
      >
        {accounts.map((account) => {
          const isActive = account.id === activeAccount.id
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
                  {account.broker ? ` \u00B7 ${account.broker}` : ''}
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
