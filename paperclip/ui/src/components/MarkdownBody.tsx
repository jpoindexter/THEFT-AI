import type { CSSProperties } from "react";
import Markdown, { type Components, type Options } from "react-markdown";
import remarkGfm from "remark-gfm";

import { Link } from "@/lib/router";
import { mentionChipInlineStyle, parseMentionChipHref } from "../lib/mention-chips";
import { parseIssueReferenceFromHref, remarkLinkIssueReferences } from "../lib/issue-reference";
import { remarkSoftBreaks } from "../lib/remark-soft-breaks";
import { cn } from "../lib/utils";
import { useTheme } from "../context/ThemeContext";
import { CodeBlock } from "./markdown-body/CodeBlock";
import {
  getLinkIcons,
  renderLinkBody,
} from "./markdown-body/link-helpers";
import { MarkdownIssueLink } from "./markdown-body/MarkdownIssueLink";
import { MermaidDiagramBlock } from "./markdown-body/MermaidDiagramBlock";
import {
  extractMermaidSource,
  MARKDOWN_WRAP_CLASS,
  safeMarkdownUrlTransform,
} from "./markdown-body/utils";
import { createRemarkWikiLinks } from "./markdown-body/wiki-links";

interface MarkdownBodyProps {
  children: string;
  className?: string;
  style?: CSSProperties;
  softBreaks?: boolean;
  linkIssueReferences?: boolean;
  /** Opt into Obsidian-style [[target]] / [[target|label]] wikilinks. */
  enableWikiLinks?: boolean;
  /** Base href used for wikilinks when no resolver is supplied. */
  wikiLinkRoot?: string;
  /** Optional href resolver for wikilinks. Return null to leave a token as plain text. */
  resolveWikiLinkHref?: (target: string, label: string) => string | null | undefined;
  /** Optional resolver for relative image paths (e.g. within export packages) */
  resolveImageSrc?: (src: string) => string | null;
  /** Called when a user clicks an inline image */
  onImageClick?: (src: string) => void;
}

export function MarkdownBody({
  children,
  className,
  style,
  softBreaks = true,
  linkIssueReferences = true,
  enableWikiLinks = false,
  wikiLinkRoot,
  resolveWikiLinkHref,
  resolveImageSrc,
  onImageClick,
}: MarkdownBodyProps) {
  const { theme } = useTheme();
  const remarkPlugins: NonNullable<Options["remarkPlugins"]> = [remarkGfm];
  if (enableWikiLinks) {
    remarkPlugins.push(createRemarkWikiLinks({ wikiLinkRoot, resolveWikiLinkHref }));
  }
  if (linkIssueReferences) {
    remarkPlugins.push(remarkLinkIssueReferences);
  }
  if (softBreaks) {
    remarkPlugins.push(remarkSoftBreaks);
  }

  const components: Components = {
    p: ({ node: _node, className: paragraphClassName, children: paragraphChildren, ...paragraphProps }) => (
      <p {...paragraphProps} className={cn(paragraphClassName, MARKDOWN_WRAP_CLASS)}>
        {paragraphChildren}
      </p>
    ),
    li: ({ node: _node, className: listItemClassName, children: listItemChildren, ...listItemProps }) => (
      <li {...listItemProps} className={cn(listItemClassName, MARKDOWN_WRAP_CLASS)}>
        {listItemChildren}
      </li>
    ),
    blockquote: ({ node: _node, className: blockquoteClassName, children: blockquoteChildren, ...blockquoteProps }) => (
      <blockquote {...blockquoteProps} className={cn(blockquoteClassName, MARKDOWN_WRAP_CLASS)}>
        {blockquoteChildren}
      </blockquote>
    ),
    table: ({ node: _node, children: tableChildren, ...tableProps }) => (
      <div className="paperclip-markdown-table-scroll" role="region" aria-label="Scrollable table" tabIndex={0}>
        <table {...tableProps}>
          {tableChildren}
        </table>
      </div>
    ),
    td: ({ node: _node, className: tableCellClassName, children: tableCellChildren, ...tableCellProps }) => (
      <td {...tableCellProps} className={cn(tableCellClassName, MARKDOWN_WRAP_CLASS)}>
        {tableCellChildren}
      </td>
    ),
    th: ({ node: _node, className: tableHeaderClassName, children: tableHeaderChildren, ...tableHeaderProps }) => (
      <th {...tableHeaderProps} className={cn(tableHeaderClassName, MARKDOWN_WRAP_CLASS)}>
        {tableHeaderChildren}
      </th>
    ),
    pre: ({ node: _node, children: preChildren, ...preProps }) => {
      const mermaidSource = extractMermaidSource(preChildren);
      if (mermaidSource) {
        return <MermaidDiagramBlock source={mermaidSource} darkMode={theme === "dark"} />;
      }
      return <CodeBlock preProps={preProps}>{preChildren}</CodeBlock>;
    },
    code: ({ node: _node, className: codeClassName, children: codeChildren, ...codeProps }) => (
      <code {...codeProps} className={cn(codeClassName, MARKDOWN_WRAP_CLASS)}>
        {codeChildren}
      </code>
    ),
    a: ({ node: _node, href, className: linkClassName, style: linkStyle, children: linkChildren, ...anchorProps }) => {
      const dataProps = anchorProps as Record<string, unknown>;
      const isWikiLink = dataProps["data-paperclip-wiki-link"] === "true";
      const linkStyleProps: { style?: CSSProperties } = linkStyle
        ? { style: linkStyle as CSSProperties }
        : {};
      if (isWikiLink && href && !/^[a-z][a-z\d+.-]*:/i.test(href) && !href.startsWith("//")) {
        return (
          <Link
            to={href}
            {...anchorProps}
            {...linkStyleProps}
            rel="noreferrer"
            className={cn(linkClassName, MARKDOWN_WRAP_CLASS)}
          >
            {linkChildren}
          </Link>
        );
      }

      const issueRef = linkIssueReferences ? parseIssueReferenceFromHref(href) : null;
      if (issueRef) {
        return (
          <MarkdownIssueLink issuePathId={issueRef.issuePathId}>
            {linkChildren}
          </MarkdownIssueLink>
        );
      }

      const parsed = href ? parseMentionChipHref(href) : null;
      if (parsed) {
        const targetHref = parsed.kind === "project"
          ? `/projects/${parsed.projectId}`
          : parsed.kind === "issue"
            ? `/issues/${parsed.identifier}`
          : parsed.kind === "skill"
            ? `/skills/${parsed.skillId}`
            : parsed.kind === "user"
              ? "/company/settings/access"
            : `/agents/${parsed.agentId}`;
        return (
          <a
            href={targetHref}
            className={cn(
              "paperclip-mention-chip",
              `paperclip-mention-chip--${parsed.kind}`,
              parsed.kind === "project" && "paperclip-project-mention-chip",
              linkClassName,
              MARKDOWN_WRAP_CLASS,
            )}
            data-mention-kind={parsed.kind}
            // Dynamic mention data controls project colors and agent icon masks; CSS classes own the static chip chrome.
            style={{ ...(linkStyle as CSSProperties | undefined), ...mentionChipInlineStyle(parsed) }}
          >
            {linkChildren}
          </a>
        );
      }

      const { leadingIcon, trailingIcon, isExternal } = getLinkIcons(href);
      return (
        <a
          href={href}
          {...anchorProps}
          {...linkStyleProps}
          {...(isExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : { rel: "noreferrer" })}
          className={cn(linkClassName, MARKDOWN_WRAP_CLASS)}
        >
          {renderLinkBody(linkChildren, leadingIcon, trailingIcon)}
        </a>
      );
    },
  };

  if (resolveImageSrc || onImageClick) {
    components.img = ({ node: _node, src, alt, className: imageClassName, ...imgProps }) => {
      const resolved = resolveImageSrc && src ? resolveImageSrc(src) : null;
      const finalSrc = resolved ?? src;
      return (
        <img
          {...imgProps}
          src={finalSrc}
          alt={alt ?? ""}
          onClick={onImageClick && finalSrc ? (e) => { e.preventDefault(); onImageClick(finalSrc); } : undefined}
          className={cn(imageClassName, onImageClick && "cursor-pointer")}
        />
      );
    };
  }

  const rootStyleProps: { style?: CSSProperties } = style ? { style } : {};

  return (
    <div
      {...rootStyleProps}
      className={cn(
        "paperclip-markdown prose prose-sm min-w-0 max-w-full break-words overflow-hidden",
        theme === "dark" && "prose-invert",
        className,
      )}
    >
      <Markdown
        remarkPlugins={remarkPlugins}
        components={components}
        urlTransform={safeMarkdownUrlTransform}
      >
        {children}
      </Markdown>
    </div>
  );
}
