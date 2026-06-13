import { useMemo, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { GearSix, DotsSixVertical } from '@phosphor-icons/react'
import { useSettings } from '@/contexts/settings-context'
import { useThemePresets } from '@/contexts/theme-presets'
import { DASHBOARD_WIDGETS } from './widget-registry'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Only configurable widgets are user-customizable; contextual nudges are excluded.
const CONFIGURABLE_WIDGETS = DASHBOARD_WIDGETS.filter(w => w.configurable !== false)
const WIDGET_BY_ID = new Map(CONFIGURABLE_WIDGETS.map(w => [w.id, w]))

// Full ordered id list (visible + hidden) over configurable widgets, de-staled.
function deriveOrderedIds(savedOrder: string[]): string[] {
  const ord = savedOrder.filter(id => WIDGET_BY_ID.has(id))
  const seen = new Set(ord)
  for (const w of CONFIGURABLE_WIDGETS) if (!seen.has(w.id)) ord.push(w.id)
  return ord
}

interface SortableRowProps {
  id: string
  label: string
  removable: boolean
  hidden: boolean
  onToggle: (id: string, show: boolean) => void
  handleHoverBg: string
}

function SortableRow({ id, label, removable, hidden, onToggle, handleHoverBg }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const [handleHover, setHandleHover] = useState(false)

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border bg-card p-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${label}`}
        onMouseEnter={() => setHandleHover(true)}
        onMouseLeave={() => setHandleHover(false)}
        className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:cursor-grabbing"
        style={{ background: handleHover ? handleHoverBg : undefined }}
      >
        <DotsSixVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 text-sm">{label}</span>
      {removable ? (
        <Switch
          checked={!hidden}
          onCheckedChange={v => onToggle(id, v)}
          aria-label={`Show ${label}`}
        />
      ) : (
        <span className="text-xs text-muted-foreground">Always on</span>
      )}
    </div>
  )
}

export function CustomizeSheet() {
  const { settings, updateSettings } = useSettings()
  const { themeColors, alpha } = useThemePresets()

  // Derive straight from settings (single source of truth). The sheet is always
  // mounted, and SettingsProvider hydrates from localStorage after first paint —
  // mirroring into local state would capture stale/empty layout and clobber the
  // real saved layout on the next write.
  const layout = settings.dashboardLayout ?? { hidden: [], order: [] }
  const ids = useMemo(() => deriveOrderedIds(layout.order), [layout.order])
  const hidden = useMemo(() => new Set(layout.hidden), [layout.hidden])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const next = arrayMove(ids, ids.indexOf(active.id as string), ids.indexOf(over.id as string))
    updateSettings({ dashboardLayout: { order: next, hidden: [...hidden] } })
  }

  const toggle = (id: string, show: boolean) => {
    const next = new Set(hidden)
    if (show) next.delete(id)
    else next.add(id)
    updateSettings({ dashboardLayout: { order: ids, hidden: [...next] } })
  }

  const reset = () => {
    updateSettings({ dashboardLayout: { hidden: [], order: [] } })
  }

  const handleHoverBg = alpha(themeColors.primary, '12')

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="default" className="gap-2 h-11 touch-manipulation">
          <GearSix className="h-4 w-4" />
          <span>Customize</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Customize dashboard</SheetTitle>
          <SheetDescription>
            Show or hide sections and drag them into the order you prefer. Pick up a section
            and use the arrow keys to reorder without a mouse.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[60vh] pr-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {ids.map(id => {
                  const widget = WIDGET_BY_ID.get(id)
                  if (!widget) return null
                  return (
                    <SortableRow
                      key={id}
                      id={id}
                      label={widget.label}
                      removable={widget.removable}
                      hidden={hidden.has(id)}
                      onToggle={toggle}
                      handleHoverBg={handleHoverBg}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        </ScrollArea>
        <SheetFooter>
          <Button variant="outline" onClick={reset} className="w-full">
            Reset to default
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
