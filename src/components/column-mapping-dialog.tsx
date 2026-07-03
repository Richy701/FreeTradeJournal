import { FileText, CheckCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useThemePresets } from '@/contexts/theme-presets';
import type { ColumnMapping } from '@/utils/import-trades';

const FIELDS = [
  { key: 'symbol', label: 'Symbol', required: true },
  { key: 'side', label: 'Side (Buy/Sell)', required: true },
  { key: 'openPrice', label: 'Entry / Open Price', required: true },
  { key: 'closePrice', label: 'Exit / Close Price', required: true },
  { key: 'quantity', label: 'Quantity / Size', required: true },
  { key: 'pnl', label: 'P&L', required: true },
  { key: 'openTime', label: 'Entry Time', required: false },
  { key: 'closeTime', label: 'Exit Time', required: false },
] as const;

interface ColumnMappingDialogProps {
  value: ColumnMapping | null;
  onChange: (next: ColumnMapping | null) => void;
  onConfirm: () => void;
}

// Shared manual column-mapping dialog used by both the Trade Log and Dashboard
// import flows, so unrecognized broker formats can be mapped from either place.
export function ColumnMappingDialog({ value, onChange, onConfirm }: ColumnMappingDialogProps) {
  const { themeColors, alpha } = useThemePresets();

  return (
    <Dialog open={!!value?.show} onOpenChange={(open) => { if (!open) onChange(null); }}>
      <DialogContent className="max-w-2xl max-h-[90svh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Map Your CSV Columns</DialogTitle>
          <DialogDescription>
            We couldn't auto-detect your CSV format. Please map your columns below.
          </DialogDescription>
        </DialogHeader>

        {value && (
          <div className="space-y-4 overflow-auto pr-1">
            <div
              className="flex items-center gap-3 rounded-lg px-4 py-2.5 border"
              style={{
                backgroundColor: `${alpha(themeColors.primary, '08')}`,
                borderColor: `${alpha(themeColors.primary, '20')}`,
              }}
            >
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium truncate" title={value.file?.name}>{value.file?.name}</span>
              <span className="text-muted-foreground text-sm">—</span>
              <span className="text-sm text-muted-foreground">{value.headers.length} columns detected</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FIELDS.map(({ key, label, required }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    {label}{required && <span style={{ color: themeColors.loss }}> *</span>}
                  </Label>
                  <Select
                    value={value.mappings[key] >= 0 ? String(value.mappings[key]) : '__none__'}
                    onValueChange={(val) => {
                      onChange({
                        ...value,
                        mappings: {
                          ...value.mappings,
                          [key]: val === '__none__' ? -1 : parseInt(val),
                        },
                      });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- None / Not Available --</SelectItem>
                      {value.headers.map((header, idx) => (
                        <SelectItem key={idx} value={String(idx)}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => onChange(null)}
                className="hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                onClick={onConfirm}
                style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
                className="hover:opacity-90 shadow-lg px-6 font-medium"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Parse with These Mappings
                </span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
