import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

const DEFAULT_SIDEBAR_WIDTH = 240;
const MIN_SIDEBAR_WIDTH = 208;
const MAX_SIDEBAR_WIDTH = 420;
const SIDEBAR_WIDTH_STEP = 16;

function clampSidebarWidth(width: number, minWidth = MIN_SIDEBAR_WIDTH, maxWidth = MAX_SIDEBAR_WIDTH) {
  return Math.min(maxWidth, Math.max(minWidth, width));
}

function readStoredSidebarWidth(
  storageKey: string,
  defaultWidth = DEFAULT_SIDEBAR_WIDTH,
  minWidth = MIN_SIDEBAR_WIDTH,
  maxWidth = MAX_SIDEBAR_WIDTH,
) {
  if (typeof window === "undefined") return defaultWidth;

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return defaultWidth;
    const parsed = Number.parseInt(stored, 10);
    if (!Number.isFinite(parsed)) return defaultWidth;
    return clampSidebarWidth(parsed, minWidth, maxWidth);
  } catch {
    return defaultWidth;
  }
}

function writeStoredSidebarWidth(
  storageKey: string,
  width: number,
  minWidth = MIN_SIDEBAR_WIDTH,
  maxWidth = MAX_SIDEBAR_WIDTH,
) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storageKey, String(clampSidebarWidth(width, minWidth, maxWidth)));
  } catch {
    // Storage can be unavailable in private contexts; resizing should still work.
  }
}

type ResizableSidebarPaneProps = {
  children: ReactNode;
  open: boolean;
  resizable?: boolean;
  storageKey?: string;
  className?: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
};

export function ResizableSidebarPane({
  children,
  open,
  resizable = false,
  storageKey = "paperclip.sidebar.width",
  className,
  defaultWidth = DEFAULT_SIDEBAR_WIDTH,
  minWidth = MIN_SIDEBAR_WIDTH,
  maxWidth = MAX_SIDEBAR_WIDTH,
}: ResizableSidebarPaneProps) {
  const [width, setWidth] = useState(() => readStoredSidebarWidth(storageKey, defaultWidth, minWidth, maxWidth));
  const [isResizing, setIsResizing] = useState(false);
  const widthRef = useRef(width);
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const storedWidth = readStoredSidebarWidth(storageKey, defaultWidth, minWidth, maxWidth);
    widthRef.current = storedWidth;
    setWidth(storedWidth);
  }, [defaultWidth, maxWidth, minWidth, storageKey]);

  const visibleWidth = open ? width : 0;
  const paneStyle = useMemo(
    () => ({ width: `${visibleWidth}px` }),
    [visibleWidth],
  );

  const commitWidth = useCallback(
    (nextWidth: number) => {
      const clamped = clampSidebarWidth(nextWidth, minWidth, maxWidth);
      widthRef.current = clamped;
      setWidth(clamped);
      writeStoredSidebarWidth(storageKey, clamped, minWidth, maxWidth);
    },
    [maxWidth, minWidth, storageKey],
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!open || !resizable) return;

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragState.current = { startX: event.clientX, startWidth: widthRef.current };
      setIsResizing(true);
    },
    [open, resizable],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!dragState.current) return;

      const nextWidth = dragState.current.startWidth + event.clientX - dragState.current.startX;
      const clamped = clampSidebarWidth(nextWidth, minWidth, maxWidth);
      widthRef.current = clamped;
      setWidth(clamped);
    },
    [maxWidth, minWidth],
  );

  const endResize = useCallback(() => {
    if (!dragState.current) return;

    dragState.current = null;
    setIsResizing(false);
    writeStoredSidebarWidth(storageKey, widthRef.current, minWidth, maxWidth);
  }, [maxWidth, minWidth, storageKey]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!open || !resizable) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        commitWidth(width - SIDEBAR_WIDTH_STEP);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        commitWidth(width + SIDEBAR_WIDTH_STEP);
      } else if (event.key === "Home") {
        event.preventDefault();
        commitWidth(minWidth);
      } else if (event.key === "End") {
        event.preventDefault();
        commitWidth(maxWidth);
      }
    },
    [commitWidth, maxWidth, minWidth, open, resizable, width],
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        !isResizing && "transition-[width] duration-100 ease-out",
        className,
      )}
      style={paneStyle}
    >
      {children}
      {resizable && open ? (
        <div
          role="separator"
          aria-label="Resize sidebar"
          aria-orientation="vertical"
          aria-valuemin={minWidth}
          aria-valuemax={maxWidth}
          aria-valuenow={width}
          tabIndex={0}
          className={cn(
            "absolute inset-y-0 right-0 z-20 w-3 cursor-col-resize touch-none outline-none",
            "before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-transparent before:transition-colors",
            "hover:before:bg-border focus-visible:before:bg-ring",
            isResizing && "before:bg-ring",
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          onLostPointerCapture={endResize}
          onKeyDown={handleKeyDown}
        />
      ) : null}
    </div>
  );
}
