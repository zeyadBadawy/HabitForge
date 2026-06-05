/**
 * Tests for ErrorBoundary.
 * CONCEPT: Testing class components with getDerivedStateFromError.
 * We use a ThrowingComponent helper that throws on demand,
 * then wrap it in ErrorBoundary to observe the caught error state.
 *
 * NOTE: React 19 logs errors to console.error even when caught by
 * an error boundary. We suppress those logs in this test.
 */

import React, { useState } from "react"
import { Text } from "react-native"
import { render, fireEvent, screen } from "@testing-library/react-native"
import ErrorBoundary from "./ErrorBoundary"

// Helper: a component that throws when `shouldThrow` is true
const ThrowingComponent: React.FC<{ shouldThrow?: boolean }> = ({
  shouldThrow = false,
}) => {
  if (shouldThrow) throw new Error("Test error")
  return <Text>Normal content</Text>
}

// Suppress React's error logging during these tests
beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText("Normal content")).toBeTruthy()
  })

  it("shows fallback UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>
    )
    expect(screen.getByTestId("error-boundary-fallback")).toBeTruthy()
  })

  it("shows a custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<Text>Custom error UI</Text>}>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>
    )
    expect(screen.getByText("Custom error UI")).toBeTruthy()
  })

  it("calls onError when a child throws", () => {
    const onError = jest.fn()
    render(
      <ErrorBoundary onError={onError}>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>
    )
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    )
  })

  it("shows a retry button in the default fallback", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>
    )
    expect(screen.getByTestId("error-boundary-retry")).toBeTruthy()
  })
})
