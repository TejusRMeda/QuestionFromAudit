"use client";

import { useCallback, useRef, useEffect } from "react";

interface ResizableDividerProps {
  onResize: (deltaX: number) => void;
  onResizeEnd: () => void;
  onDoubleClick: () => void;
}

/**
 * Draggable divider between split-screen panels
 */
export default function ResizableDivider({
  onResize,
  onResizeEnd,
  onDoubleClick,
}: ResizableDividerProps) {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const mouseHandlersRef = useRef<{
    move: ((e: MouseEvent) => void) | null;
    up: (() => void) | null;
  }>({ move: null, up: null });
  const touchHandlersRef = useRef<{
    move: ((e: TouchEvent) => void) | null;
    end: (() => void) | null;
  }>({ move: null, end: null });

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      if (mouseHandlersRef.current.move) {
        document.removeEventListener("mousemove", mouseHandlersRef.current.move);
      }
      if (mouseHandlersRef.current.up) {
        document.removeEventListener("mouseup", mouseHandlersRef.current.up);
      }
      if (touchHandlersRef.current.move) {
        document.removeEventListener("touchmove", touchHandlersRef.current.move);
      }
      if (touchHandlersRef.current.end) {
        document.removeEventListener("touchend", touchHandlersRef.current.end);
      }
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startX.current = e.clientX;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current) return;
        const deltaX = moveEvent.clientX - startX.current;
        startX.current = moveEvent.clientX;
        onResize(deltaX);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        mouseHandlersRef.current = { move: null, up: null };
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        onResizeEnd();
      };

      mouseHandlersRef.current = { move: handleMouseMove, up: handleMouseUp };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [onResize, onResizeEnd]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      isDragging.current = true;
      startX.current = e.touches[0].clientX;

      const handleTouchMove = (moveEvent: TouchEvent) => {
        if (!isDragging.current) return;
        const deltaX = moveEvent.touches[0].clientX - startX.current;
        startX.current = moveEvent.touches[0].clientX;
        onResize(deltaX);
      };

      const handleTouchEnd = () => {
        isDragging.current = false;
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
        touchHandlersRef.current = { move: null, end: null };
        onResizeEnd();
      };

      touchHandlersRef.current = { move: handleTouchMove, end: handleTouchEnd };
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    },
    [onResize, onResizeEnd]
  );

  return (
    <div
      className="w-1 bg-base-300 hover:bg-primary/30 cursor-col-resize transition-colors relative group flex-shrink-0"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onDoubleClick={onDoubleClick}
      role="separator"
      aria-orientation="vertical"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          onResize(-20);
          onResizeEnd();
        } else if (e.key === "ArrowRight") {
          onResize(20);
          onResizeEnd();
        }
      }}
    >
      {/* Visual indicator on hover */}
      <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-primary/10 transition-colors" />
      {/* Drag handle dots */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-1 h-1 rounded-full bg-base-content/40" />
        <div className="w-1 h-1 rounded-full bg-base-content/40" />
        <div className="w-1 h-1 rounded-full bg-base-content/40" />
      </div>
    </div>
  );
}
