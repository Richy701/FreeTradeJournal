import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface MobileTableProps {
  data: any[]
  columns: {
    key: string
    header: string
    render?: (value: any, row: any) => React.ReactNode
    className?: string
  }[]
  className?: string
}

export function MobileTable({ data, columns, className }: MobileTableProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {data.map((row, rowIndex) => (
        <Card key={rowIndex} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="space-y-2">
              {columns.map((column) => (
                <div 
                  key={column.key} 
                  className={cn(
                    "flex justify-between items-center",
                    column.className
                  )}
                >
                  <span className="text-sm text-muted-foreground">
                    {column.header}
                  </span>
                  <span className="text-sm font-medium text-right">
                    {column.render 
                      ? column.render(row[column.key], row)
                      : row[column.key]
                    }
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface ResponsiveTableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode
  mobileCards?: boolean
}

export const ResponsiveTable = React.forwardRef<
  HTMLTableElement,
  ResponsiveTableProps
>(({ className, children, mobileCards = true, ...props }, ref) => {
  if (mobileCards) {
    return (
      <>
        {/* Desktop view */}
        <div className="hidden md:block relative w-full overflow-auto">
          <table
            ref={ref}
            className={cn("w-full caption-bottom text-sm", className)}
            {...props}
          >
            {children}
          </table>
        </div>
        
        {/* Mobile view - rendered as cards */}
        <div className="md:hidden">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === 'tbody') {
              const childProps = child.props as { children?: React.ReactNode }
              const rows = React.Children.toArray(childProps.children)
              return (
                <div className="space-y-3">
                  {rows.map((row, index) => {
                    if (!React.isValidElement(row)) return null
                    const rowProps = row.props as { children?: React.ReactNode }
                    const cells = React.Children.toArray(rowProps.children)
                    return (
                      <Card key={index} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            {cells.map((cell, cellIndex) => {
                              if (!React.isValidElement(cell)) return null
                              const cellProps = cell.props as { children?: React.ReactNode }
                              return (
                                <div key={cellIndex} className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">
                                    Column {cellIndex + 1}
                                  </span>
                                  <span className="text-sm font-medium">
                                    {cellProps.children}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )
            }
            return null
          })}
        </div>
      </>
    )
  }

  // Standard table with horizontal scroll on mobile
  return (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  )
})
ResponsiveTable.displayName = "ResponsiveTable"