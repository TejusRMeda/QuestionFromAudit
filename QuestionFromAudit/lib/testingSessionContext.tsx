"use client";

/**
 * React context that signals whether the current trust-reviewer screen is
 * rendered as a usability-testing session. Components that POST suggestions
 * or comments read this value and stamp `isTestSession: true` on the request
 * body; the API persists it as `is_test_session` on the row so the data can
 * be filtered out of the real review queue.
 *
 * The provider wraps the body of `InstancePageClient` exactly when the page
 * was loaded via `/instance/[trustLinkId]/testing` (i.e. testingConfig is
 * non-null). Default for the rest of the app is false.
 */

import { createContext, useContext, type ReactNode } from "react";

const TestingSessionContext = createContext<boolean>(false);

export function TestingSessionProvider({
  isTestSession,
  children,
}: {
  isTestSession: boolean;
  children: ReactNode;
}) {
  return (
    <TestingSessionContext.Provider value={isTestSession}>
      {children}
    </TestingSessionContext.Provider>
  );
}

/** Read the current testing-session flag. Returns false outside any provider. */
export function useIsTestSession(): boolean {
  return useContext(TestingSessionContext);
}
