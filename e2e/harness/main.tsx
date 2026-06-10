import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { InstrumentCombobox } from '@/components/ui/instrument-combobox'

// Reproduces the real app: the InstrumentCombobox lives inside a modal Dialog
// (the edit-trade dialog). This is the exact composition that triggers the
// focus-trap bug where the cmdk search input cannot receive keystrokes.
const categories = [
  {
    category: 'Index Futures',
    instruments: [
      { symbol: 'NQ', name: 'E-mini Nasdaq' },
      { symbol: 'MNQ', name: 'Micro E-mini Nasdaq' },
      { symbol: 'ES', name: 'E-mini S&P 500' },
    ],
  },
]

function App() {
  const [value, setValue] = useState('NQ')
  return (
    <div style={{ padding: 40 }}>
      <Dialog>
        <DialogTrigger data-testid="open-dialog">Open edit dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Edit Trade</DialogTitle>
          <InstrumentCombobox
            value={value}
            onChange={setValue}
            categories={categories}
            placeholder="Select instrument"
          />
        </DialogContent>
      </Dialog>
      <div data-testid="current-value">{value}</div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
