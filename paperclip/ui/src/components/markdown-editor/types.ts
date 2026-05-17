import type { SkillCommandOption } from "../../context/EditorAutocompleteContext";

export interface MentionOption {
  id: string;
  name: string;
  kind?: "agent" | "project" | "user";
  agentId?: string;
  agentIcon?: string | null;
  projectId?: string;
  projectColor?: string | null;
  userId?: string;
}

export interface MentionState {
  trigger: "mention" | "skill";
  marker: "@" | "/";
  query: string;
  top: number;
  left: number;
  viewportTop: number;
  viewportBottom: number;
  viewportLeft: number;
  textNode: Text;
  atPos: number;
  endPos: number;
}

export type AutocompleteOption = MentionOption | SkillCommandOption;

export interface MentionMenuViewport {
  offsetLeft: number;
  offsetTop: number;
  width: number;
  height: number;
}

export interface MentionMenuSize {
  width: number;
  height: number;
}

export interface CaretRect {
  top: number;
  bottom: number;
  x: number;
}

export interface MarkdownEditorRef {
  focus: () => void;
}
