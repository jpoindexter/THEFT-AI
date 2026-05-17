type MarkdownAstNode = {
  type?: string;
  value?: string;
  children?: MarkdownAstNode[];
  url?: string;
  title?: string | null;
  data?: {
    hProperties?: Record<string, string>;
  };
};

type ParsedWikiLink = {
  target: string;
  label: string;
};

const WIKI_LINK_PATTERN = /\[\[([^\]\r\n]+)\]\]/g;
const WIKI_LINK_SKIP_PARENT_TYPES = new Set([
  "definition",
  "image",
  "imageReference",
  "link",
  "linkReference",
]);

function parseWikiLinkBody(body: string): ParsedWikiLink | null {
  const [rawTarget, ...rawLabelParts] = body.split("|");
  const target = rawTarget?.trim() ?? "";
  const label = rawLabelParts.length > 0 ? rawLabelParts.join("|").trim() : target;
  if (!target || target.includes("[") || target.includes("]")) return null;
  return {
    target,
    label: label || target,
  };
}

function encodeWikiLinkTarget(target: string): string | null {
  const trimmed = target.trim();
  if (!trimmed || /^[a-z][a-z\d+.-]*:/i.test(trimmed) || trimmed.startsWith("//")) return null;

  const hashIndex = trimmed.indexOf("#");
  const rawPath = (hashIndex >= 0 ? trimmed.slice(0, hashIndex) : trimmed)
    .trim()
    .replace(/^\/+/, "");
  if (
    !rawPath ||
    rawPath.includes("\\") ||
    rawPath.split("/").some((segment) => !segment || segment === "." || segment === "..")
  ) {
    return null;
  }

  const encodedPath = rawPath.split("/").map((segment) => encodeURIComponent(segment)).join("/");
  const rawHash = hashIndex >= 0 ? trimmed.slice(hashIndex + 1).trim() : "";
  return rawHash ? `${encodedPath}#${encodeURIComponent(rawHash)}` : encodedPath;
}

function defaultWikiLinkHref(target: string, wikiLinkRoot?: string): string | null {
  const encodedTarget = encodeWikiLinkTarget(target);
  if (!encodedTarget) return null;
  const root = wikiLinkRoot?.trim().replace(/\/+$/, "") ?? "";
  return root ? `${root}/${encodedTarget}` : encodedTarget;
}

function createWikiLinkNode(href: string, wikiLink: ParsedWikiLink): MarkdownAstNode {
  return {
    type: "link",
    url: href,
    title: null,
    data: {
      hProperties: {
        "data-paperclip-wiki-link": "true",
        "data-paperclip-wiki-target": wikiLink.target,
      },
    },
    children: [{ type: "text", value: wikiLink.label }],
  };
}

function splitTextByWikiLinks(
  value: string,
  options: {
    wikiLinkRoot?: string;
    resolveWikiLinkHref?: (target: string, label: string) => string | null | undefined;
  },
): MarkdownAstNode[] {
  const nodes: MarkdownAstNode[] = [];
  let lastIndex = 0;

  for (const match of value.matchAll(WIKI_LINK_PATTERN)) {
    const raw = match[0] ?? "";
    const body = match[1] ?? "";
    const start = match.index ?? 0;
    if (start > lastIndex) {
      nodes.push({ type: "text", value: value.slice(lastIndex, start) });
    }

    const wikiLink = parseWikiLinkBody(body);
    let resolvedHref: string | null = null;
    if (wikiLink) {
      if (options.resolveWikiLinkHref) {
        const customHref = options.resolveWikiLinkHref(wikiLink.target, wikiLink.label);
        resolvedHref = customHref === undefined
          ? defaultWikiLinkHref(wikiLink.target, options.wikiLinkRoot)
          : customHref;
      } else {
        resolvedHref = defaultWikiLinkHref(wikiLink.target, options.wikiLinkRoot);
      }
    }

    if (wikiLink && resolvedHref) {
      nodes.push(createWikiLinkNode(resolvedHref, wikiLink));
    } else {
      nodes.push({ type: "text", value: raw });
    }
    lastIndex = start + raw.length;
  }

  if (lastIndex < value.length) {
    nodes.push({ type: "text", value: value.slice(lastIndex) });
  }

  return nodes;
}

function transformWikiLinkChildren(
  node: MarkdownAstNode,
  options: {
    wikiLinkRoot?: string;
    resolveWikiLinkHref?: (target: string, label: string) => string | null | undefined;
  },
) {
  if (!node.children || WIKI_LINK_SKIP_PARENT_TYPES.has(node.type ?? "")) return;

  node.children = node.children.flatMap((child) => {
    if (child.type === "text" && typeof child.value === "string" && child.value.includes("[[")) {
      return splitTextByWikiLinks(child.value, options);
    }
    transformWikiLinkChildren(child, options);
    return child;
  });
}

export function createRemarkWikiLinks(options: {
  wikiLinkRoot?: string;
  resolveWikiLinkHref?: (target: string, label: string) => string | null | undefined;
}) {
  return function remarkWikiLinks() {
    return (tree: MarkdownAstNode) => {
      transformWikiLinkChildren(tree, options);
    };
  };
}
