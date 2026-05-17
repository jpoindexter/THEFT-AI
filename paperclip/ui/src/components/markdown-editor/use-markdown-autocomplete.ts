import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type TouchEvent as ReactTouchEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MDXEditorMethods } from "@mdxeditor/editor";
import type { SkillCommandOption } from "../../context/EditorAutocompleteContext";
import { applyMentionChipDecoration, clearMentionChipDecoration, parseMentionChipHref } from "../../lib/mention-chips";
import {
  applyMention,
  findClosestAutocompleteAnchor,
  isSameAutocompleteSession,
  isSelectionInsideCodeLikeElement,
  placeCaretAfterMentionAnchor,
} from "./autocomplete-utils";
import {
  computeMentionMenuPosition,
  detectMention,
  getMentionMenuSize,
  getMentionMenuViewport,
} from "./mention-position";
import type { AutocompleteOption, MentionOption, MentionState } from "./types";

export function useMarkdownAutocomplete({
  containerRef,
  echoIgnoreMarkdownRef,
  editorRef,
  latestValueRef,
  mentions,
  onChange,
  slashCommands,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  echoIgnoreMarkdownRef: RefObject<string | null>;
  editorRef: RefObject<MDXEditorMethods | null>;
  latestValueRef: RefObject<string>;
  mentions?: MentionOption[];
  onChange: (value: string) => void;
  slashCommands: SkillCommandOption[];
}) {
  const [mentionState, setMentionState] = useState<MentionState | null>(null);
  const mentionStateRef = useRef<MentionState | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const skillEnterArmedRef = useRef(false);
  const autocompleteSelectionHandledRef = useRef(false);
  const mentionActive = mentionState !== null && (
    (mentionState.trigger === "mention" && Boolean(mentions?.length))
    || (mentionState.trigger === "skill" && slashCommands.length > 0)
  );
  const mentionOptionByKey = useMemo(() => {
    const map = new Map<string, MentionOption>();
    for (const mention of mentions ?? []) {
      if (mention.kind === "agent") {
        const agentId = mention.agentId ?? mention.id.replace(/^agent:/, "");
        map.set(`agent:${agentId}`, mention);
      }
      if (mention.kind === "user" && mention.userId) {
        map.set(`user:${mention.userId}`, mention);
      }
      if (mention.kind === "project" && mention.projectId) {
        map.set(`project:${mention.projectId}`, mention);
      }
    }
    return map;
  }, [mentions]);

  const filteredMentions = useMemo<AutocompleteOption[]>(() => {
    if (!mentionState) return [];
    const q = mentionState.query.trim().toLowerCase();
    if (mentionState.trigger === "skill") {
      return slashCommands
        .filter((command) => {
          if (!q) return true;
          return command.aliases.some((alias) => alias.toLowerCase().includes(q));
        })
        .slice(0, 8);
    }
    if (!mentions) return [];
    return mentions.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 8);
  }, [mentionState, mentions, slashCommands]);

  const decorateProjectMentions = useCallback(() => {
    const editable = containerRef.current?.querySelector('[contenteditable="true"]');
    if (!editable) return;
    const links = editable.querySelectorAll("a");
    for (const node of links) {
      const link = node as HTMLAnchorElement;
      const parsed = parseMentionChipHref(link.getAttribute("href") ?? "");
      if (!parsed) {
        clearMentionChipDecoration(link);
        continue;
      }

      if (parsed.kind === "project") {
        const option = mentionOptionByKey.get(`project:${parsed.projectId}`);
        applyMentionChipDecoration(link, {
          ...parsed,
          color: parsed.color ?? option?.projectColor ?? null,
        });
        continue;
      }
      if (parsed.kind === "skill" || parsed.kind === "user" || parsed.kind === "issue") {
        applyMentionChipDecoration(link, parsed);
        continue;
      }

      const option = mentionOptionByKey.get(`agent:${parsed.agentId}`);
      applyMentionChipDecoration(link, {
        ...parsed,
        icon: parsed.icon ?? option?.agentIcon ?? null,
      });
    }
  }, [containerRef, mentionOptionByKey]);

  const checkMention = useCallback(() => {
    if (!containerRef.current || isSelectionInsideCodeLikeElement(containerRef.current)) {
      mentionStateRef.current = null;
      skillEnterArmedRef.current = false;
      setMentionState(null);
      return;
    }
    const result = detectMention(containerRef.current);
    if (result && result.trigger === "mention" && (!mentions || mentions.length === 0)) {
      mentionStateRef.current = null;
      skillEnterArmedRef.current = false;
      setMentionState(null);
      return;
    }
    if (result && result.trigger === "skill" && slashCommands.length === 0) {
      mentionStateRef.current = null;
      skillEnterArmedRef.current = false;
      setMentionState(null);
      return;
    }
    const previous = mentionStateRef.current;
    const sameSession = isSameAutocompleteSession(previous, result);
    mentionStateRef.current = result;
    if (!sameSession) {
      skillEnterArmedRef.current = false;
      setMentionIndex(0);
    }
    setMentionState(result);
  }, [containerRef, mentions, slashCommands.length]);

  useEffect(() => {
    if ((!mentions || mentions.length === 0) && slashCommands.length === 0) return;
    const el = containerRef.current;
    const onInput = () => requestAnimationFrame(checkMention);
    document.addEventListener("selectionchange", checkMention);
    el?.addEventListener("input", onInput, true);
    return () => {
      document.removeEventListener("selectionchange", checkMention);
      el?.removeEventListener("input", onInput, true);
    };
  }, [checkMention, containerRef, mentions, slashCommands.length]);

  useEffect(() => {
    if (!mentionActive) return;
    const updatePosition = () => requestAnimationFrame(checkMention);
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", updatePosition);
    viewport?.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      viewport?.removeEventListener("resize", updatePosition);
      viewport?.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [checkMention, mentionActive]);

  useEffect(() => {
    if (mentionActive) return;
    autocompleteSelectionHandledRef.current = false;
  }, [mentionActive]);

  useEffect(() => {
    const editable = containerRef.current?.querySelector('[contenteditable="true"]');
    if (!editable) return;
    decorateProjectMentions();
    const observer = new MutationObserver(() => {
      decorateProjectMentions();
    });
    observer.observe(editable, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [containerRef, decorateProjectMentions]);

  const selectMention = useCallback((option: AutocompleteOption) => {
    const state = mentionStateRef.current;
    if (!state) return false;
    const current = latestValueRef.current;
    const next = applyMention(current, state, option);
    if (next !== current) {
      latestValueRef.current = next;
      echoIgnoreMarkdownRef.current = next;
      editorRef.current?.setMarkdown(next);
      onChange(next);
    }

    const restoreSelection = (attemptsRemaining: number) => {
      const editable = containerRef.current?.querySelector('[contenteditable="true"]');
      if (!(editable instanceof HTMLElement)) return;
      decorateProjectMentions();
      editable.focus();
      const target = findClosestAutocompleteAnchor(editable, option, state);
      if (!target) {
        if (attemptsRemaining > 0) {
          requestAnimationFrame(() => restoreSelection(attemptsRemaining - 1));
        }
        return;
      }
      placeCaretAfterMentionAnchor(target);
    };

    requestAnimationFrame(() => restoreSelection(4));
    mentionStateRef.current = null;
    skillEnterArmedRef.current = false;
    setMentionState(null);
    return true;
  }, [containerRef, decorateProjectMentions, echoIgnoreMarkdownRef, editorRef, latestValueRef, onChange]);

  const handleAutocompletePress = useCallback((
    event: ReactMouseEvent<HTMLButtonElement> | ReactPointerEvent<HTMLButtonElement> | ReactTouchEvent<HTMLButtonElement>,
    option: AutocompleteOption,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (autocompleteSelectionHandledRef.current) return;
    const handled = selectMention(option);
    if (handled) {
      autocompleteSelectionHandledRef.current = true;
    }
  }, [selectMention]);

  const touchStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const handleAutocompleteTouchStart = useCallback((event: ReactTouchEvent<HTMLButtonElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartPointRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);
  const handleAutocompleteTouchMove = useCallback((event: ReactTouchEvent<HTMLButtonElement>) => {
    const start = touchStartPointRef.current;
    if (!start) return;
    const touch = event.touches[0];
    if (!touch) return;
    if (Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 8) {
      touchStartPointRef.current = null;
    }
  }, []);
  const handleAutocompleteTouchEnd = useCallback((
    event: ReactTouchEvent<HTMLButtonElement>,
    option: AutocompleteOption,
  ) => {
    const start = touchStartPointRef.current;
    touchStartPointRef.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    if (Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 8) return;
    handleAutocompletePress(event, option);
  }, [handleAutocompletePress]);

  const mentionMenuPosition = mentionState
    ? computeMentionMenuPosition(
        mentionState,
        getMentionMenuViewport(),
        getMentionMenuSize(filteredMentions.length),
      )
    : null;

  return {
    checkMention,
    filteredMentions,
    handleAutocompletePress,
    handleAutocompleteTouchEnd,
    handleAutocompleteTouchMove,
    handleAutocompleteTouchStart,
    mentionActive,
    mentionIndex,
    mentionMenuPosition,
    mentionStateRef,
    selectMention,
    setMentionIndex,
    setMentionState,
    skillEnterArmedRef,
  };
}
