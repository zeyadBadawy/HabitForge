/**
 * CONCEPT: React class component — the ONLY place in this codebase where
 * a class component is required. Error boundaries MUST be class components
 * because they rely on `componentDidCatch` and `getDerivedStateFromError`,
 * two lifecycle methods that have no functional component equivalent.
 *
 * WHY FUNCTIONAL COMPONENTS DON'T WORK HERE: `useEffect` cannot catch
 * render-time errors thrown by children — only class lifecycle methods
 * can intercept the error during React's "render phase" and prevent the
 * whole tree from unmounting.
 *
 * USAGE: Wrap any section of the tree that might throw:
 *   <ErrorBoundary>
 *     <HabitList />
 *   </ErrorBoundary>
 *
 * GOTCHA: Error boundaries do NOT catch:
 *   - Event handler errors (use try/catch inside the handler)
 *   - Async errors (use try/catch in async functions)
 *   - Errors inside the ErrorBoundary itself
 *   - Server-side rendering errors
 */

import React, { type ReactNode } from "react"
import { View, Text, StyleSheet, Pressable } from "react-native"
import { spacing, typography, borderRadius } from "../../../theme/theme"

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional custom fallback UI — defaults to a built-in error screen */
  fallback?: ReactNode
  /** Called when an error is caught — useful for error reporting services */
  onError?: (error: Error, info: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT (class — required for error boundaries)
// ─────────────────────────────────────────────────────────────────

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  /**
   * getDerivedStateFromError is called during rendering when a child throws.
   * It must be a static method. Return value is merged into state.
   * This is the React equivalent of a try/catch around the render tree.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  /**
   * componentDidCatch is called after the error has been caught.
   * Use it for side effects like logging — not for updating state.
   */
  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    this.props.onError?.(error, info)
    // In production, you'd send to Sentry/Bugsnag here
    if (__DEV__) {
      console.error("[ErrorBoundary]", error, info.componentStack)
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Show custom fallback if provided, otherwise the default error UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <View style={styles.container} testID="error-boundary-fallback">
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          {__DEV__ && this.state.error ? (
            // Show error details in development only — never expose in production
            <Text style={styles.detail}>{this.state.error.message}</Text>
          ) : null}
          <Pressable
            onPress={this.handleReset}
            style={styles.retryButton}
            testID="error-boundary-retry"
          >
            <Text style={styles.retryLabel}>Try again</Text>
          </Pressable>
        </View>
      )
    }

    return this.props.children
  }
}

// ─────────────────────────────────────────────────────────────────
// STYLES
// (No useTheme here — class components can't use hooks.
//  Use hardcoded neutral colors or pass theme as a prop if needed.)
// ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: "#F9FAFB",
  },
  emoji: {
    fontSize: typography.xxxl,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: "#111827",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  detail: {
    fontSize: typography.xs,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: spacing.md,
    fontFamily: "monospace",
  },
  retryButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: "#6C63FF",
    borderRadius: borderRadius.md,
  },
  retryLabel: {
    color: "#FFFFFF",
    fontSize: typography.md,
    fontWeight: typography.semibold,
  },
})

export default ErrorBoundary
