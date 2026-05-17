import type { MentionOption } from "../MarkdownEditor";

export interface InlineEditorProps {
  value: string;
  onSave: (value: string) => void | Promise<unknown>;
  as?: "h1" | "h2" | "p" | "span";
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  imageUploadHandler?: (file: File) => Promise<string>;
  /** Called when a non-image file is dropped onto the editor. */
  onDropFile?: (file: File) => Promise<void>;
  mentions?: MentionOption[];
  nullable?: boolean;
  /** When true, long display-mode markdown is clipped with a fade curtain that expands on click. */
  foldable?: boolean;
}
