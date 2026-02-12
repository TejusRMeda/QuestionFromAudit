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

  // Track container width for pixel calculations
  useEffect(() => {
    const updateWidth = () => {
      setContainerWidth(window.innerWidth);
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
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
      <div
        className="flex-shrink-0 overflow-auto md:block"
        style={{
          width: `${leftWidthPercent}%`,
        }}
      >
        {leftPanel}
      </div>

      {/* Resizable Divider - Hidden on mobile */}
      <div className="hidden md:block">
        <ResizableDivider
          onResize={handleResize}
          onResizeEnd={handleResizeEnd}
          onDoubleClick={handleDoubleClick}
        />
      </div>

      {/* Right Panel - Edit Panel */}
      <div
        className="flex-grow overflow-auto hidden md:block"
        style={{
          width: `${100 - leftWidthPercent}%`,
        }}
      >
        {rightPanel}
      </div>
    </div>
  );
}
