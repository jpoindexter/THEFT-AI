import { AGENT_ROLE_LABELS, type Agent } from "@paperclipai/shared";
import type { OrgNode } from "../../api/agents";

export const CARD_W = 200;
export const CARD_H = 100;
export const GAP_X = 32;
export const GAP_Y = 80;
export const PADDING = 60;
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 2;
export const TOUCH_MOVE_THRESHOLD = 6;

export interface LayoutNode {
  id: string;
  name: string;
  role: string;
  status: string;
  x: number;
  y: number;
  children: LayoutNode[];
}

export interface Point {
  x: number;
  y: number;
}

export interface ChartBounds {
  width: number;
  height: number;
}

export interface OrgChartEdge {
  parent: LayoutNode;
  child: LayoutNode;
}

function subtreeWidth(node: OrgNode): number {
  if (node.reports.length === 0) return CARD_W;
  const childrenW = node.reports.reduce((sum, child) => sum + subtreeWidth(child), 0);
  const gaps = (node.reports.length - 1) * GAP_X;
  return Math.max(CARD_W, childrenW + gaps);
}

function layoutTree(node: OrgNode, x: number, y: number): LayoutNode {
  const totalW = subtreeWidth(node);
  const layoutChildren: LayoutNode[] = [];

  if (node.reports.length > 0) {
    const childrenW = node.reports.reduce((sum, child) => sum + subtreeWidth(child), 0);
    const gaps = (node.reports.length - 1) * GAP_X;
    let childX = x + (totalW - childrenW - gaps) / 2;

    for (const child of node.reports) {
      const childWidth = subtreeWidth(child);
      layoutChildren.push(layoutTree(child, childX, y + CARD_H + GAP_Y));
      childX += childWidth + GAP_X;
    }
  }

  return {
    id: node.id,
    name: node.name,
    role: node.role,
    status: node.status,
    x: x + (totalW - CARD_W) / 2,
    y,
    children: layoutChildren,
  };
}

export function layoutForest(roots: OrgNode[]): LayoutNode[] {
  let x = PADDING;
  const result: LayoutNode[] = [];
  for (const root of roots) {
    const width = subtreeWidth(root);
    result.push(layoutTree(root, x, PADDING));
    x += width + GAP_X;
  }
  return result;
}

export function flattenLayout(nodes: LayoutNode[]): LayoutNode[] {
  const result: LayoutNode[] = [];
  function walk(node: LayoutNode) {
    result.push(node);
    node.children.forEach(walk);
  }
  nodes.forEach(walk);
  return result;
}

export function collectEdges(nodes: LayoutNode[]): OrgChartEdge[] {
  const edges: OrgChartEdge[] = [];
  function walk(node: LayoutNode) {
    for (const child of node.children) {
      edges.push({ parent: node, child });
      walk(child);
    }
  }
  nodes.forEach(walk);
  return edges;
}

export function getChartBounds(nodes: LayoutNode[]): ChartBounds {
  if (nodes.length === 0) return { width: 800, height: 600 };
  let maxX = 0;
  let maxY = 0;
  for (const node of nodes) {
    maxX = Math.max(maxX, node.x + CARD_W);
    maxY = Math.max(maxY, node.y + CARD_H);
  }
  return { width: maxX + PADDING, height: maxY + PADDING };
}

export function clampZoom(value: number): number {
  return Math.min(Math.max(value, MIN_ZOOM), MAX_ZOOM);
}

export function roleLabel(role: string): string {
  return AGENT_ROLE_LABELS[role as keyof typeof AGENT_ROLE_LABELS] ?? role;
}

export function getStatusDotClass(status: string): string {
  if (status === "running") return "bg-ring";
  if (status === "active") return "bg-primary";
  if (status === "error") return "bg-destructive";
  if (status === "terminated") return "bg-muted-foreground";
  return "bg-accent-foreground";
}

export function buildAgentMap(agents: Agent[] | undefined): Map<string, Agent> {
  const map = new Map<string, Agent>();
  for (const agent of agents ?? []) map.set(agent.id, agent);
  return map;
}
