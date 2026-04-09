"use client";

import { useState, useCallback, useEffect, ReactNode } from "react";
import ResizableDivider from "./ResizableDivider";

interface SplitScreenLayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  defaultLeftWidthPercent?: number;
  minLeftWidth?: number;
  minRightWidth?: number;
  storageKey?: string;
  /** When true on mobile, show the right panel instead of left */
  showRightOnMobile?: boolean;
  /** Callback to go back to left panel on mobile */
  onMobileBack?: () => void;
}

const DEFAULT_LEFT_WIDTH_PERCENT = 55;
const MIN_LEFT_WIDTH = 320;
const MIN_RIGHT_WIDTH = 400;

/**
 * Split-screen layout with resizable panels
 *
 * On mobile (<768px), only shows the left panel.
 * Use MobileEditModal for editing on mobile.
 */
export default function SplitScreenLayout({
  leftPanel,
  rightPanel,
  defaultLeftWidthPercent = DEFAULT_LEFT_WIDTH_PERCENT,
  minLeftWidth = MIN_LEFT_WIDTH,
  minRightWidth = MIN_RIGHT_WIDTH,
  storageKey = "split-panel-width",
  showRightOnMobile = false,
  onMobileBack,
}: SplitScreenLayoutProps) {
  const [leftWidthPercent, setLeftWidthPercent] = useState(defaultLeftWidthPercent);
  const [containerWidth, setContainerWidth] = useState(0);

  // Load saved width from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 20 && parsed <= 80) {
          setLeftWidthPercent(parsed);
        }
      }
    } catch {
      // localStorage may be unavailable (private browsing, storage full, etc.)
    }
  }, [storageKey]);

  // Track container width for pixel calculations (debounced)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const updateWidth = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setContainerWidth(window.innerWidth);
      }, 100);
    };
    // Initial measurement without debounce
    setContainerWidth(window.innerWidth);
    window.addEventListener("resize", updateWidth);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  const handleResize = useCallback(
    (deltaX: number) => {
      if (containerWidth === 0) return;

      setLeftWidthPercent((prev) => {
        const deltaPercent = (deltaX / containerWidth) * 100;
        const newPercent = prev + deltaPercent;

        // Calculate pixel widths for min constraints
        const leftPixels = (newPercent / 100) * containerWidth;
        const rightPixels = containerWidth - leftPixels;

        // Enforce min widths
        if (leftPixels < minLeftWidth) {
          return (minLeftWidth / containerWidth) * 100;
        }
        if (rightPixels < minRightWidth) {
          return ((containerWidth - minRightWidth) / containerWidth) * 100;
        }

        // Clamp to reasonable bounds
        return Math.max(20, Math.min(80, newPercent));
      });
    },
    [containerWidth, minLeftWidth, minRightWidth]
  );

  const handleResizeEnd = useCallback(() => {
    try {
      localStorage.setItem(storageKey, leftWidthPercent.toString());
    } catch {
      // localStorage may be unavailable
    }
  }, [storageKey, leftWidthPercent]);

  const handleDoubleClick = useCallback(() => {
    setLeftWidthPercent(50);
    try {
      localStorage.setItem(storageKey, "50");
    } catch {
      // localStorage may be unavailable
    }
  }, [storageKey]);

  return (
    <div className="flex h-full min-h-0">
      {/* Left Panel - Questions List */}
      {/* Desktop: percentage width. Mobile: full width, hidden when right panel is shown */}
      <div
        className={`flex-shrink-0 overflow-auto ${showRightOnMobile ? "hidden md:block" : "w-full md:w-auto"}`}
        style={{ width: containerWidth >= 768 ? `${leftWidthPercent}%` : undefined }}
      >
        {leftPanel}
      </div>

      {/* Resizable Divider - Hidden on mobile */}
      <div className="hidden md:flex h-full z-10">
        <ResizableDivider
          onResize={handleResize}
          onResizeEnd={handleResizeEnd}
          onDoubleClick={handleDoubleClick}
        />
      </div>

      {/* Right Panel */}
      {/* Desktop: always visible. Mobile: only when showRightOnMobile */}
      <div
        className={`flex-grow overflow-hidden ${showRightOnMobile ? "block" : "hidden md:block"}`}
        style={{ width: containerWidth >= 768 ? `${100 - leftWidthPercent}%` : undefined }}
      >
        <div className="h-full flex flex-col">
          {/* Mobile back button */}
          {showRightOnMobile && onMobileBack && (
            <button
              onClick={onMobileBack}
              className="md:hidden flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#4A90A4] bg-white border-b border-slate-200 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Questions
            </button>
          )}
          <div className="flex-1 overflow-hidden">
            {rightPanel}
          </div>
        </div>
      </div>
    </div>
  );
}
