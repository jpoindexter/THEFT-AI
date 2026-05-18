import type { Touch, TouchEvent } from "react";
import { TOUCH_MOVE_THRESHOLD, clampZoom, type Point } from "./orgChartModel";

export interface TouchGesture {
  mode: "pan" | "pinch" | null;
  startPoint: Point;
  startPan: Point;
  startZoom: number;
  startDistance: number;
  startCenter: Point;
  moved: boolean;
}

export function initialTouchGesture(): TouchGesture {
  return {
    mode: null,
    startPoint: { x: 0, y: 0 },
    startPan: { x: 0, y: 0 },
    startZoom: 1,
    startDistance: 0,
    startCenter: { x: 0, y: 0 },
    moved: false,
  };
}

function touchPoint(touch: Touch): Point {
  return { x: touch.clientX, y: touch.clientY };
}

function touchDistance(a: Touch, b: Touch): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function touchCenter(a: Touch, b: Touch, container: HTMLDivElement): Point {
  const rect = container.getBoundingClientRect();
  return { x: (a.clientX + b.clientX) / 2 - rect.left, y: (a.clientY + b.clientY) / 2 - rect.top };
}

export function makePanGesture(touch: Touch, pan: Point, zoom: number): TouchGesture {
  return { ...initialTouchGesture(), mode: "pan", startPoint: touchPoint(touch), startPan: pan, startZoom: zoom };
}

export function makePinchGesture(first: Touch, second: Touch, container: HTMLDivElement, pan: Point, zoom: number): TouchGesture {
  return {
    ...initialTouchGesture(),
    mode: "pinch",
    startPan: pan,
    startZoom: zoom,
    startDistance: touchDistance(first, second),
    startCenter: touchCenter(first, second, container),
  };
}

export function handlePinchMove(
  event: TouchEvent<HTMLDivElement>,
  container: HTMLDivElement,
  gesture: TouchGesture,
  pan: Point,
  zoom: number,
  setPan: (point: Point) => void,
  setZoom: (zoom: number) => void,
) {
  const [first, second] = [event.touches[0]!, event.touches[1]!];
  const distance = touchDistance(first, second);
  const center = touchCenter(first, second, container);
  if (gesture.mode !== "pinch" || gesture.startDistance === 0) {
    Object.assign(gesture, makePinchGesture(first, second, container, pan, zoom));
    return;
  }
  const nextZoom = clampZoom(gesture.startZoom * (distance / gesture.startDistance));
  const scale = nextZoom / gesture.startZoom;
  const dx = center.x - gesture.startCenter.x;
  const dy = center.y - gesture.startCenter.y;
  gesture.moved =
    gesture.moved ||
    Math.abs(distance - gesture.startDistance) > TOUCH_MOVE_THRESHOLD ||
    Math.hypot(dx, dy) > TOUCH_MOVE_THRESHOLD;
  setZoom(nextZoom);
  setPan({ x: center.x - scale * (gesture.startCenter.x - gesture.startPan.x), y: center.y - scale * (gesture.startCenter.y - gesture.startPan.y) });
}

export function handlePanMove(event: TouchEvent<HTMLDivElement>, gesture: TouchGesture, setPan: (point: Point) => void) {
  const touch = event.touches[0];
  if (!touch || gesture.mode !== "pan") return;
  const dx = touch.clientX - gesture.startPoint.x;
  const dy = touch.clientY - gesture.startPoint.y;
  gesture.moved = gesture.moved || Math.hypot(dx, dy) > TOUCH_MOVE_THRESHOLD;
  setPan({ x: gesture.startPan.x + dx, y: gesture.startPan.y + dy });
}

export function scheduleClickSuppression(
  suppressNextCardClick: { current: boolean },
  suppressClickTimerRef: { current: number | null },
) {
  suppressNextCardClick.current = true;
  if (suppressClickTimerRef.current !== null) window.clearTimeout(suppressClickTimerRef.current);
  suppressClickTimerRef.current = window.setTimeout(() => {
    suppressNextCardClick.current = false;
    suppressClickTimerRef.current = null;
  }, 400);
}
