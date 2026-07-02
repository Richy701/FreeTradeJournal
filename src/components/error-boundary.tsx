import { Component, type ErrorInfo, type ReactNode } from 'react'
import * as Sentry from '@sentry/react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional custom fallback. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode
  /** Short label for the default fallback, e.g. "This section". */
  label?: string
}

interface ErrorBoundaryState {
  error: Error | null
}

// Generic error boundary. Catches render-time errors so one failing subtree
// (e.g. a widget hitting a bad date in localStorage) renders a fallback instead
// of unmounting the whole app to a blank screen.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep a console trace for debugging without crashing the page.
    console.error('ErrorBoundary caught an error:', error, info.componentStack)
    // Boundaries swallow errors before Sentry's global handler sees them —
    // report explicitly so crashes stay visible in telemetry.
    Sentry.captureException(error, { contexts: { react: { componentStack: info.componentStack } } })
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (error) {
      if (this.props.fallback) return this.props.fallback(error, this.reset)
      return (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center">
          <p className="text-sm font-medium text-foreground">
            {this.props.label ?? 'This section'} couldn't load
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Something went wrong rendering this content.
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={this.reset}>
            Try again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
