import * as React from "react"
import { Check, CaretUpDown } from '@phosphor-icons/react'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import type { InstrumentGroup } from "@/constants/trading"

/** Symbols may arrive bare (forex pairs describe themselves) or with a name. */
const instrumentLabel = (instrument: { symbol: string; name?: string }) =>
  instrument.name ? `${instrument.symbol} - ${instrument.name}` : instrument.symbol

interface InstrumentComboboxProps {
  value: string
  onChange: (value: string) => void
  categories: readonly InstrumentGroup[]
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
        if (inst.symbol === value) return instrumentLabel(inst)
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
        if (inst.symbol === searchUpper) return true
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
          <CaretUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        portalled={false}
        className="z-[200] w-[--radix-popover-trigger-width] max-w-[calc(100vw-2rem)] p-0"
        align="start"
      >
        <Command shouldFilter={true}>
          <CommandInput
            placeholder="Search or type custom symbol..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
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
                  const sym = instrument.symbol
                  const label = instrumentLabel(instrument)
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
