import { useCallback, useEffect, useRef, useState } from "react";

export function usePromptsPaneLayout({
  bundleLoading,
  isMobile,
  visibleFileCount,
}: {
  bundleLoading: boolean;
  isMobile: boolean;
  visibleFileCount: number;
}) {
  const [filePanelWidth, setFilePanelWidth] = useState(260);
  const [instructionPaneWidth, setInstructionPaneWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMobile) {
      setInstructionPaneWidth(null);
      return;
    }
    const element = containerRef.current;
    if (!element) return;

    const updateWidth = () => setInstructionPaneWidth(element.getBoundingClientRect().width);
    updateWidth();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setInstructionPaneWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [bundleLoading, isMobile, visibleFileCount]);

  const handleSeparatorDrag = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = filePanelWidth;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      setFilePanelWidth(Math.max(180, Math.min(500, startWidth + delta)));
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [filePanelWidth]);

  useEffect(() => {
    containerRef.current?.style.setProperty(
      "--agent-instructions-file-width",
      `${filePanelWidth / 16}rem`,
    );
  }, [filePanelWidth]);

  return {
    containerRef,
    filePanelWidth,
    handleSeparatorDrag,
    instructionPaneWidth,
  };
}
