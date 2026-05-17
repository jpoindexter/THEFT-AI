import type { CaretRect, MentionMenuSize, MentionMenuViewport, MentionState } from "./types";

const MENTION_MENU_WIDTH = 188;
const MENTION_MENU_HEIGHT = 208;
const MENTION_MENU_PADDING = 8;
const MENTION_MENU_ROW_HEIGHT = 34;
const MENTION_MENU_CHROME_HEIGHT = 8;
const MENTION_MENU_CARET_GAP = 10;

export function findMentionMatch(
  text: string,
  offset: number,
): Pick<MentionState, "trigger" | "marker" | "query" | "atPos" | "endPos"> | null {
  let atPos = -1;
  let trigger: MentionState["trigger"] | null = null;
  let marker: MentionState["marker"] | null = null;
  for (let i = offset - 1; i >= 0; i--) {
    const ch = text[i];
    if (ch === "@" || ch === "/") {
      if (i === 0 || /\s/.test(text[i - 1])) {
        atPos = i;
        trigger = ch === "@" ? "mention" : "skill";
        marker = ch;
      }
      break;
    }
    if (ch === "\n" || ch === "\r") break;
  }

  if (atPos === -1) return null;
  const query = text.slice(atPos + 1, offset);
  if (trigger === "skill" && /\s/.test(query)) return null;

  return {
    trigger: trigger ?? "mention",
    marker: marker ?? "@",
    query,
    atPos,
    endPos: offset,
  };
}

function measureCaretRect(textNode: Text, offset: number, atPos: number): CaretRect {
  const length = textNode.textContent?.length ?? 0;
  const rectFromRange = (start: number, end: number, side: "right" | "left"): CaretRect | null => {
    if (start < 0 || end > length || end <= start) return null;
    const range = document.createRange();
    range.setStart(textNode, start);
    range.setEnd(textNode, end);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    return { top: rect.top, bottom: rect.bottom, x: side === "right" ? rect.right : rect.left };
  };

  return (
    rectFromRange(Math.max(0, offset - 1), offset, "right")
    ?? rectFromRange(offset, Math.min(length, offset + 1), "left")
    ?? rectFromRange(atPos, atPos + 1, "right")
    ?? { top: 0, bottom: 0, x: 0 }
  );
}

export function detectMention(container: HTMLElement): MentionState | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return null;

  const range = sel.getRangeAt(0);
  const textNode = range.startContainer;
  if (textNode.nodeType !== Node.TEXT_NODE) return null;
  if (!container.contains(textNode)) return null;

  const text = textNode.textContent ?? "";
  const offset = range.startOffset;
  const match = findMentionMatch(text, offset);
  if (!match) return null;

  const caret = measureCaretRect(textNode as Text, offset, match.atPos);
  const containerRect = container.getBoundingClientRect();

  return {
    trigger: match.trigger,
    marker: match.marker,
    query: match.query,
    top: caret.top - containerRect.top,
    left: caret.x - containerRect.left,
    viewportTop: caret.top,
    viewportBottom: caret.bottom,
    viewportLeft: caret.x,
    textNode: textNode as Text,
    atPos: match.atPos,
    endPos: match.endPos,
  };
}

export function getMentionMenuViewport(): MentionMenuViewport {
  const viewport = window.visualViewport;
  if (viewport) {
    return {
      offsetLeft: viewport.offsetLeft,
      offsetTop: viewport.offsetTop,
      width: viewport.width,
      height: viewport.height,
    };
  }

  return {
    offsetLeft: 0,
    offsetTop: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function computeMentionMenuPosition(
  anchor: Pick<MentionState, "viewportTop" | "viewportBottom" | "viewportLeft">,
  viewport: MentionMenuViewport,
  menuSize: MentionMenuSize = { width: MENTION_MENU_WIDTH, height: MENTION_MENU_HEIGHT },
) {
  const minLeft = viewport.offsetLeft + MENTION_MENU_PADDING;
  const maxLeft = viewport.offsetLeft + viewport.width - menuSize.width;
  const minTop = viewport.offsetTop + MENTION_MENU_PADDING;
  const maxTop = viewport.offsetTop + viewport.height - menuSize.height;
  const desiredTop = viewport.offsetTop + anchor.viewportTop;
  const top = desiredTop > maxTop
    ? Math.max(minTop, Math.min(viewport.offsetTop + anchor.viewportBottom - menuSize.height, maxTop))
    : Math.max(minTop, desiredTop);
  const desiredLeft = viewport.offsetLeft + anchor.viewportLeft + MENTION_MENU_CARET_GAP;
  const left = Math.max(minLeft, Math.min(desiredLeft, maxLeft));
  return { top, left };
}

export function getMentionMenuSize(optionCount: number): MentionMenuSize {
  const visibleRows = Math.max(1, Math.min(optionCount, 8));
  return {
    width: MENTION_MENU_WIDTH,
    height: Math.min(
      MENTION_MENU_HEIGHT,
      visibleRows * MENTION_MENU_ROW_HEIGHT + MENTION_MENU_CHROME_HEIGHT,
    ),
  };
}
