import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PROP_FIRMS } from '@/constants/trading';

const PROP_FIRM_CUSTOM = '__custom__';

interface PropFirmSelectProps {
  value: string;
  onChange: (value: string) => void;
  triggerId?: string;
  triggerClassName?: string;
}

/**
 * Prop-firm picker for the trade form. Offers the preset list plus a free-text
 * "Custom…" option so traders on firms that aren't listed (Lucid, Tradeify, etc.)
 * can tag their own without us having to maintain an exhaustive list.
 */
export function PropFirmSelect({ value, onChange, triggerId, triggerClassName }: PropFirmSelectProps) {
  const isPreset = value === 'none' || (PROP_FIRMS as readonly string[]).includes(value);
  const customActive = !!value && value !== 'none' && !isPreset;
  const [showCustom, setShowCustom] = useState(customActive);
  const selectValue = showCustom || customActive ? PROP_FIRM_CUSTOM : value || 'none';

  return (
    <>
      <Select
        value={selectValue}
        onValueChange={(v) => {
          if (v === PROP_FIRM_CUSTOM) {
            setShowCustom(true);
            onChange('');
          } else {
            setShowCustom(false);
            onChange(v);
          }
        }}
      >
        <SelectTrigger id={triggerId} className={triggerClassName}>
          <SelectValue placeholder="None" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {PROP_FIRMS.map((firm) => (
            <SelectItem key={firm} value={firm}>
              {firm}
            </SelectItem>
          ))}
          <SelectItem value={PROP_FIRM_CUSTOM}>Custom…</SelectItem>
        </SelectContent>
      </Select>
      {(showCustom || customActive) && (
        <Input
          className={triggerClassName ? `mt-2 ${triggerClassName}` : 'mt-2'}
          placeholder="Enter prop firm name"
          value={value === 'none' ? '' : value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </>
  );
}
