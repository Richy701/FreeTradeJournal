import { useMemo, useState, type ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DotsSixVertical } from '@phosphor-icons/react'
import { ErrorBoundary } from '@/components/error-boundary'
import { useSettings } from '@/contexts/settings-context'
import { useThemePresets } from '@/contexts/theme-presets'
import { cn } from '@/lib/utils'
import {
  deriveOrderedWidgetIds,
  type DashboardWidget,
  type WidgetRenderCtx,
} from './widget-registry'

interface SortableWidgetProps {
  id: string
  label: string
  children: ReactNode
  handleHoverBg: string
}

// Drag straight from the dashboard -- no edit mode, no toggle. The handle lives in
// the page's left gutter and fades in on hover, so it never covers a card title or
// a chart control, and the widget body stays fully clickable (only the handle
// carries the drag listeners).
//
// Desktop only: the gutter is 32px at lg and there's no hover on touch. Phones
// reorder through the Customize sheet, where the rows are a compact list instead
// of full-height widgets.
function SortableWidget({ id, label, children, handleHoverBg }: SortableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const [handleHover, setHandleHover] = useState(false)

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Move ${label}`}
        onMouseEnter={() => setHandleHover(true)}
        onMouseLeave={() => setHandleHover(false)}
        // touch-action must be off the browser's hands or a drag scrolls the page.
        style={{ touchAction: 'none', background: handleHover ? handleHoverBg : undefined }}
        className={cn(
          'absolute right-full top-2 z-10 mr-0.5 hidden h-6 w-6 shrink-0 cursor-grab items-center justify-center',
          'rounded-md text-muted-foreground opacity-0 transition-opacity lg:flex',
          'group-hover:opacity-100 focus:opacity-100',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:cursor-grabbing',
          isDragging && 'opacity-100'
        )}
      >
        <DotsSixVertical className="h-4 w-4" />
      </button>
      {children}
    </div>
  )
}

interface WidgetStackProps {
  widgets: DashboardWidget[]
  ctx: WidgetRenderCtx
}

export function WidgetStack({ widgets, ctx }: WidgetStackProps) {
  const { settings, updateSettings } = useSettings()
  const { themeColors, alpha } = useThemePresets()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Only configurable widgets can move; the contextual nudges stay pinned at the end.
  const sortable = useMemo(() => widgets.filter(w => w.configurable !== false), [widgets])
  const pinned = useMemo(() => widgets.filter(w => w.configurable === false), [widgets])
  const sortableIds = useMemo(() => sortable.map(w => w.id), [sortable])

  const activeLabel = sortable.find(w => w.id === activeId)?.label ?? ''

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeKey = active.id as string
    const overKey = over.id as string
    const oldIdx = sortableIds.indexOf(activeKey)
    const newIdx = sortableIds.indexOf(overKey)
    if (oldIdx < 0 || newIdx < 0) return
    // Write against the FULL ordered list (visible + hidden), not just what's on
    // screen -- otherwise every drag here would strip the hidden widgets' slots
    // and silently rewrite the Customize sheet's order.
    const full = deriveOrderedWidgetIds(settings.dashboardLayout?.order ?? [])
    const next = full.filter(id => id !== activeKey)
    const overPos = next.indexOf(overKey)
    if (overPos < 0) return
    next.splice(newIdx > oldIdx ? overPos + 1 : overPos, 0, activeKey)
    updateSettings({
      dashboardLayout: { order: next, hidden: settings.dashboardLayout?.hidden ?? [] },
    })
  }

  const renderWidget = (w: DashboardWidget) => {
    const node = w.render(ctx)
    // Isolate each widget: a single one throwing (e.g. on a bad date in
    // saved data) must not blank the entire dashboard.
    return node ? <ErrorBoundary>{node}</ErrorBoundary> : null
  }

  const handleHoverBg = alpha(themeColors.primary, '12')

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {/* Mirrors the spacing the widgets had as direct children of the page
          container, so nothing shifts by adding the drag layer. */}
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {sortable.map(w => {
            const node = renderWidget(w)
            return node ? (
              <SortableWidget key={w.id} id={w.id} label={w.label} handleHoverBg={handleHoverBg}>
                {node}
              </SortableWidget>
            ) : null
          })}
        </SortableContext>
        {pinned.map(w => {
          const node = renderWidget(w)
          return node ? <div key={w.id}>{node}</div> : null
        })}
      </div>
      {/* Dragging a live 450px chart around measures badly and stutters, so the
          thing that follows the cursor is a compact label instead. */}
      <DragOverlay>
        {activeId ? (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-lg">
            <DotsSixVertical className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{activeLabel}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
