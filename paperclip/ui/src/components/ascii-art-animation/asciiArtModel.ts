export const CHARS = [" ", ".", "·", "▪", "▫", "○"] as const;
export const TARGET_FPS = 24;
export const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;

export const PAPERCLIP_SPRITES = [
  [
    "  ╭────╮ ",
    " ╭╯╭──╮│ ",
    " │ │  ││ ",
    " │ │  ││ ",
    " │ │  ││ ",
    " │ │  ││ ",
    " │ ╰──╯│ ",
    " ╰─────╯ ",
  ],
  [
    " ╭─────╮ ",
    " │╭──╮╰╮ ",
    " ││  │ │ ",
    " ││  │ │ ",
    " ││  │ │ ",
    " ││  │ │ ",
    " │╰──╯ │ ",
    " ╰────╯  ",
  ],
] as const;

export type PaperclipSprite = (typeof PAPERCLIP_SPRITES)[number];

export interface Clip {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  drift: number;
  sprite: PaperclipSprite;
  width: number;
  height: number;
}

export function measureChar(container: HTMLElement): { w: number; h: number } {
  const span = document.createElement("span");
  span.textContent = "M";
  span.className = "absolute invisible whitespace-pre font-mono text-micro leading-none";
  container.appendChild(span);
  const rect = span.getBoundingClientRect();
  container.removeChild(span);
  return { w: rect.width, h: rect.height };
}

export function spriteSize(sprite: PaperclipSprite): { width: number; height: number } {
  let width = 0;
  for (const row of sprite) width = Math.max(width, row.length);
  return { width, height: sprite.length };
}
