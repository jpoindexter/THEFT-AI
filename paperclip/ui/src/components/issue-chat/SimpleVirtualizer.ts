import { useEffect, useRef, useState, type Key } from "react";

export type VirtualizedScrollMode =
  | { kind: "window" }
  | { kind: "element"; element: HTMLElement };

type SimpleVirtualItem = {
  index: number;
  key: Key;
  start: number;
  size: number;
};

export function useIssueThreadVirtualizer({
  count,
  estimateSize,
  overscan,
  scrollMargin,
  gap,
  getItemKey,
  mode,
}: {
  count: number;
  estimateSize: () => number;
  overscan: number;
  scrollMargin: number;
  gap: number;
  getItemKey: (index: number) => Key;
  mode: VirtualizedScrollMode;
}) {
  const measuredSizeByKeyRef = useRef(new Map<Key, number>());
  const [, rerender] = useState(0);
  const estimatedSize = estimateSize();

  const itemStarts: number[] = [];
  const itemSizes: number[] = [];
  let nextStart = scrollMargin;
  for (let index = 0; index < count; index += 1) {
    const key = getItemKey(index);
    const size = measuredSizeByKeyRef.current.get(key) ?? estimatedSize;
    itemStarts.push(nextStart);
    itemSizes.push(size);
    nextStart += size + gap;
  }
  const totalSize = Math.max(0, nextStart - scrollMargin - gap);

  const viewportHeight = () => (mode.kind === "window" ? window.innerHeight : mode.element.clientHeight);
  const scrollOffset = () => (mode.kind === "window" ? window.scrollY : mode.element.scrollTop);
  const maxScrollOffset = () => {
    const targetScrollHeight = mode.kind === "window"
      ? document.documentElement.scrollHeight
      : mode.element.scrollHeight;
    return Math.max(0, Math.max(targetScrollHeight, totalSize) - viewportHeight());
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const target: Window | HTMLElement = mode.kind === "window" ? window : mode.element;
    const update = () => rerender((value) => value + 1);
    target.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      target.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [mode]);

  const rawStart = Math.max(scrollMargin, scrollOffset());
  const rawEnd = rawStart + viewportHeight();
  let visibleStartIndex = 0;
  while (
    visibleStartIndex < count - 1
    && itemStarts[visibleStartIndex] + itemSizes[visibleStartIndex] < rawStart
  ) {
    visibleStartIndex += 1;
  }
  let visibleEndIndex = visibleStartIndex;
  while (visibleEndIndex < count - 1 && itemStarts[visibleEndIndex] <= rawEnd) {
    visibleEndIndex += 1;
  }
  const startIndex = Math.max(0, visibleStartIndex - overscan);
  const endIndex = Math.min(count - 1, visibleEndIndex + overscan);
  const virtualItems: SimpleVirtualItem[] = [];
  for (let index = startIndex; index <= endIndex; index += 1) {
    virtualItems.push({
      index,
      key: getItemKey(index),
      start: itemStarts[index] ?? scrollMargin,
      size: itemSizes[index] ?? estimatedSize,
    });
  }

  const scrollToIndex = (
    index: number,
    options?: { align?: "start" | "center" | "end" | "auto"; behavior?: ScrollBehavior },
  ) => {
    const clampedIndex = Math.max(0, Math.min(index, count - 1));
    const targetMax = maxScrollOffset();
    let top = itemStarts[clampedIndex] ?? scrollMargin;
    if (options?.align === "center") {
      top = top - viewportHeight() / 2 + (itemSizes[clampedIndex] ?? estimatedSize) / 2;
    } else if (options?.align === "end") {
      top = top + (itemSizes[clampedIndex] ?? estimatedSize) - viewportHeight();
    }
    top = Math.max(0, Math.min(top, targetMax));
    if (mode.kind === "window") {
      window.scrollTo({ top, behavior: options?.behavior });
    } else {
      mode.element.scrollTo({ top, behavior: options?.behavior });
    }
    rerender((value) => value + 1);
  };

  return {
    getVirtualItems: () => virtualItems,
    getTotalSize: () => totalSize,
    scrollToIndex,
    measure: () => undefined,
    measureElement: (element?: HTMLElement | null) => {
      if (!element) return;
      const index = Number(element.dataset.index);
      if (!Number.isInteger(index) || index < 0 || index >= count) return;
      const measuredSize = element.getBoundingClientRect().height || element.offsetHeight;
      if (!Number.isFinite(measuredSize) || measuredSize <= 0) return;
      const key = getItemKey(index);
      const previousSize = measuredSizeByKeyRef.current.get(key) ?? estimatedSize;
      if (Math.abs(previousSize - measuredSize) < 1) return;
      measuredSizeByKeyRef.current.set(key, measuredSize);
      rerender((value) => value + 1);
    },
  };
}
