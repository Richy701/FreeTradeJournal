import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface InstrumentCategory {
  category: string
  instruments: (string | { symbol: string; name: string })[]
}

interface InstrumentComboboxProps {
  value: string
  onChange: (value: string) => void
  categories: InstrumentCategory[]
  placeholder?: string
}

export function InstrumentCombobox({
  value,
  onChange,
  categories,
  placeholder = "Select instrument...",
}: InstrumentComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // Build a display label for the current value
  const displayLabel = React.useMemo(() => {
    if (!value) return ""
    for (const cat of categories) {
      for (const inst of cat.instruments) {
        if (typeof inst === "string") {
          if (inst === value) return inst
        } else {
          if (inst.symbol === value) return `${inst.symbol} - ${inst.name}`
        }
      }
    }
    // Custom / unknown symbol — just show it uppercased
    return value.toUpperCase()
  }, [value, categories])

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue)
    setOpen(false)
    setSearch("")
  }

  // Check if the search term already matches a known instrument
  const searchUpper = search.trim().toUpperCase()
  const isKnown = React.useMemo(() => {
    for (const cat of categories) {
      for (const inst of cat.instruments) {
        const sym = typeof inst === "string" ? inst : inst.symbol
        if (sym === searchUpper) return true
      }
    }
    return false
  }, [categories, searchUpper])

  const showCustomOption = searchUpper.length > 0 && !isKnown

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full min-w-0 justify-between text-lg font-normal whitespace-normal h-9 px-3"
        >
          <span className="truncate text-left">{value ? displayLabel : <span className="text-muted-foreground">{placeholder}</span>}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-w-[calc(100vw-2rem)] p-0" align="start">
        <Command shouldFilter={true}>
          <CommandInput
            placeholder="Search or type custom symbol..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {searchUpper.length > 0
                ? "No matching instruments. Press enter or click below to use custom symbol."
                : "No instruments found."}
            </CommandEmpty>
            {showCustomOption && (
              <CommandGroup heading="Custom Symbol">
                <CommandItem
                  value={`custom-${searchUpper}`}
                  onSelect={() => handleSelect(searchUpper)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === searchUpper ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Use &quot;{searchUpper}&quot;
                </CommandItem>
              </CommandGroup>
            )}
            {categories.map((cat) => (
              <CommandGroup key={cat.category} heading={cat.category}>
                {cat.instruments.map((instrument) => {
                  const sym = typeof instrument === "string" ? instrument : instrument.symbol
                  const label =
                    typeof instrument === "string"
                      ? instrument
                      : `${instrument.symbol} - ${instrument.name}`
                  return (
                    <CommandItem
                      key={sym}
                      value={label}
                      onSelect={() => handleSelect(sym)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === sym ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {label}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
