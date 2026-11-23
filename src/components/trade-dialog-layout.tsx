import type { ComponentProps } from 'react'
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export function TradeDialogContent({ className, ...props }: ComponentProps<typeof DialogContent>) {
  return <DialogContent className={cn('w-[calc(100%-2rem)] sm:max-w-4xl max-h-[90svh] overflow-y-auto gap-5 p-5 sm:p-6', className)} {...props} />
}

export function TradeDialogHeader({ editing = false }: { editing?: boolean }) {
  return <DialogHeader className="border-b border-border/60 pb-4">
    <DialogTitle className="text-xl font-semibold">{editing ? 'Edit trade' : 'Add trade'}</DialogTitle>
    <DialogDescription>Enter your trade details or import from your broker.</DialogDescription>
  </DialogHeader>
}

export function TradeDialogTabs() {
  return <TabsList className="mb-5 grid h-11 sm:h-11 w-full sm:w-full grid-cols-2 gap-1 rounded-lg bg-muted p-1">
    <TabsTrigger value="manual" className="h-9 rounded-md border-0 px-4 focus-visible:ring-inset focus-visible:ring-offset-0 data-[state=active]:bg-background data-[state=active]:shadow-sm">Manual entry</TabsTrigger>
    <TabsTrigger value="import" className="h-9 rounded-md border-0 px-4 focus-visible:ring-inset focus-visible:ring-offset-0 data-[state=active]:bg-background data-[state=active]:shadow-sm">Import trades</TabsTrigger>
  </TabsList>
}

export const tradeDialogActions = 'sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 border-t border-border/60 bg-card py-4'
