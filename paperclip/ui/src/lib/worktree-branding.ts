export type WorktreeUiBranding = {
  enabled: true;
  name: string;
  color: string;
  textColor: string;
};

type RgbColor = { r: number; g: number; b: number };

const BLACK_RGB: RgbColor = { r: 0, g: 0, b: 0 };
const READABLE_TEXT_LIGHT: RgbColor = { r: 248, g: 250, b: 252 };
const READABLE_TEXT_DARK: RgbColor = { r: 17, g: 24, b: 39 };

function readMetaContent(name: string): string | null {
  if (typeof document === "undefined") return null;
  const element = document.querySelector(`meta[name="${name}"]`);
  const content = element?.getAttribute("content")?.trim();
  return content ? content : null;
}

function normalizeHexColor(value: string | null): string | null {
  if (!value) return null;
  const hex = value.startsWith("#") ? value.slice(1) : value;
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${hex.split("").map((char) => `${char}${char}`).join("").toLowerCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex.toLowerCase()}`;
  }
  return null;
}

function colorChannelToHex(value: number): string {
  return value.toString(16).padStart(2, "0");
}

function rgbToHex({ r, g, b }: RgbColor): string {
  return `#${colorChannelToHex(r)}${colorChannelToHex(g)}${colorChannelToHex(b)}`;
}

function hexToRgb(color: string): RgbColor {
  const normalized = normalizeHexColor(color);
  if (!normalized) return BLACK_RGB;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function relativeLuminanceChannel(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function pickReadableTextColor(background: string): string {
  const { r, g, b } = hexToRgb(background);
  const luminance =
    (0.2126 * relativeLuminanceChannel(r)) +
    (0.7152 * relativeLuminanceChannel(g)) +
    (0.0722 * relativeLuminanceChannel(b));
  const whiteContrast = 1.05 / (luminance + 0.05);
  const blackContrast = (luminance + 0.05) / 0.05;
  return rgbToHex(whiteContrast >= blackContrast ? READABLE_TEXT_LIGHT : READABLE_TEXT_DARK);
}

export function getWorktreeUiBranding(): WorktreeUiBranding | null {
  if (readMetaContent("paperclip-worktree-enabled") !== "true") return null;

  const name = readMetaContent("paperclip-worktree-name");
  const color = normalizeHexColor(readMetaContent("paperclip-worktree-color"));
  if (!name || !color) return null;

  return {
    enabled: true,
    name,
    color,
    textColor: normalizeHexColor(readMetaContent("paperclip-worktree-text-color")) ?? pickReadableTextColor(color),
  };
}
