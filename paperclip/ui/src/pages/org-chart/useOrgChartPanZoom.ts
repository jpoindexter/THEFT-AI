import { useCallback, useEffect, useRef, useState, type MouseEvent, type TouchEvent, type WheelEvent } from "react";
import {
  clampZoom,
  type ChartBounds,
  type LayoutNode,
  type Point,
} from "./orgChartModel";
import {
  handlePanMove,
  handlePinchMove,
  initialTouchGesture,
  makePanGesture,
  makePinchGesture,
  scheduleClickSuppression,
  type TouchGesture,
} from "./orgChartGestures";

export function useOrgChartPanZoom(nodes: LayoutNode[], bounds: ChartBounds) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const touchGesture = useRef<TouchGesture>(initialTouchGesture());
  const suppressNextCardClick = useRef(false);
  const suppressClickTimerRef = useRef<number | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    return () => {
      if (suppressClickTimerRef.current !== null) window.clearTimeout(suppressClickTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (hasInitialized.current || nodes.length === 0 || !containerRef.current) return;
    hasInitialized.current = true;
    centerChart(containerRef.current, bounds, setPan, setZoom);
  }, [bounds, nodes.length]);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("[data-org-card]")) return;
    setDragging(true);
    dragStart.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragging) return;
    setPan({
      x: dragStart.current.panX + event.clientX - dragStart.current.x,
      y: dragStart.current.panY + event.clientY - dragStart.current.y,
    });
  }, [dragging]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  const zoomTowardPoint = useCallback((newZoom: number, point: Point) => {
    const clampedZoom = clampZoom(newZoom);
    const scale = clampedZoom / zoom;
    setPan({ x: point.x - scale * (point.x - pan.x), y: point.y - scale * (point.y - pan.y) });
    setZoom(clampedZoom);
  }, [pan, zoom]);

  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    zoomTowardPoint(zoom * (event.deltaY < 0 ? 1.1 : 0.9), {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }, [zoom, zoomTowardPoint]);

  const fitToScreen = useCallback(() => {
    if (containerRef.current) centerChart(containerRef.current, bounds, setPan, setZoom);
  }, [bounds]);

  const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length >= 2 && containerRef.current) {
      const [first, second] = [event.touches[0]!, event.touches[1]!];
      touchGesture.current = makePinchGesture(first, second, containerRef.current, pan, zoom);
      return;
    }
    const touch = event.touches[0];
    if (!touch) return;
    touchGesture.current = makePanGesture(touch, pan, zoom);
  }, [pan, zoom]);

  const handleTouchMove = useCallback((event: TouchEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container || !touchGesture.current.mode) return;
    if (event.touches.length >= 2) {
      handlePinchMove(event, container, touchGesture.current, pan, zoom, setPan, setZoom);
      return;
    }
    handlePanMove(event, touchGesture.current, setPan);
  }, [pan, zoom]);

  const handleTouchEnd = useCallback(() => {
    if (touchGesture.current.moved) scheduleClickSuppression(suppressNextCardClick, suppressClickTimerRef);
    touchGesture.current = { ...initialTouchGesture(), startPan: pan, startZoom: zoom };
  }, [pan, zoom]);

  const consumeSuppressedCardClick = useCallback((event: MouseEvent) => {
    if (!suppressNextCardClick.current) return;
    suppressNextCardClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    containerRef,
    pan,
    zoom,
    dragging,
    fitToScreen,
    zoomTowardPoint,
    consumeSuppressedCardClick,
    handlers: { handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd },
  };
}

function centerChart(container: HTMLDivElement, bounds: ChartBounds, setPan: (point: Point) => void, setZoom: (zoom: number) => void) {
  const fitZoom = Math.min((container.clientWidth - 40) / bounds.width, (container.clientHeight - 40) / bounds.height, 1);
  setZoom(fitZoom);
  setPan({ x: (container.clientWidth - bounds.width * fitZoom) / 2, y: (container.clientHeight - bounds.height * fitZoom) / 2 });
}
