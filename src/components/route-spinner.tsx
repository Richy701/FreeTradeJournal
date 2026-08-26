// CSS-only route-loading spinner. Deliberately avoids icon imports: any eager
// icon reference in the entry graph drags the whole icon vendor chunk into the
// critical path for every visitor.
export function RouteSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
