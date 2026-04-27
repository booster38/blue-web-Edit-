import type { Node, Connection, View } from './types';

export const screenToWorld = (sx: number, sy: number, view: View, canvasRef: HTMLElement | null) => {
  const rect = canvasRef?.getBoundingClientRect();
  const localX = rect ? sx - rect.left : sx;
  const localY = rect ? sy - rect.top : sy;
  return {
    x: (localX - view.x) / view.zoom,
    y: (localY - view.y) / view.zoom
  };
};

export const getConnectionPath = (connection: Connection, nodes: Node[]) => {
  const fromNode = nodes.find((n) => n.id === connection.from);
  const toNode = nodes.find((n) => n.id === connection.to);
  if (!fromNode || !toNode) return '';

  const startX = fromNode.x + fromNode.width;
  const startY = fromNode.y + fromNode.height / 2;
  const endX = toNode.x;
  const endY = toNode.y + toNode.height / 2;

  const dx = endX - startX;
  const controlOffset = Math.min(Math.abs(dx) * 0.5, 100);

  return `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
};

export const getConnectionStartX = (connection: Connection, nodes: Node[]) => {
  const fromNode = nodes.find((n) => n.id === connection.from);
  return fromNode ? fromNode.x + fromNode.width : 0;
};

export const getConnectionStartY = (connection: Connection, nodes: Node[]) => {
  const fromNode = nodes.find((n) => n.id === connection.from);
  return fromNode ? fromNode.y + fromNode.height / 2 : 0;
};

export const getConnectionEndX = (connection: Connection, nodes: Node[]) => {
  const toNode = nodes.find((n) => n.id === connection.to);
  return toNode ? toNode.x : 0;
};

export const getConnectionEndY = (connection: Connection, nodes: Node[]) => {
  const toNode = nodes.find((n) => n.id === connection.to);
  return toNode ? toNode.y + toNode.height / 2 : 0;
};

export const getTempConnectionPath = (connectingSource: string | null, connectingTarget: string | null, nodes: Node[], mousePos: { x: number; y: number }) => {
  if (connectingSource) {
    const fromNode = nodes.find((n) => n.id === connectingSource);
    if (!fromNode) return '';
    const startX = fromNode.x + fromNode.width;
    const startY = fromNode.y + fromNode.height / 2;
    const endX = mousePos.x;
    const endY = mousePos.y;

    const dx = endX - startX;
    const controlOffset = Math.min(Math.abs(dx) * 0.5, 100);

    return `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
  } else if (connectingTarget) {
    const toNode = nodes.find((n) => n.id === connectingTarget);
    if (!toNode) return '';
    const startX = mousePos.x;
    const startY = mousePos.y;
    const endX = toNode.x;
    const endY = toNode.y + toNode.height / 2;

    const dx = endX - startX;
    const controlOffset = Math.min(Math.abs(dx) * 0.5, 100);

    return `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
  }
  return '';
};

export const isInputConnected = (nodeId: string, connections: Connection[]) => {
  return connections.some((conn) => conn.to === nodeId);
};

export interface ArrangeOptions {
  verticalGap?: number;
  levelGap?: number;
}

export const arrangeNodes = (nodes: Node[], connections: Connection[], options: ArrangeOptions = {}) => {
  const { verticalGap = 50, levelGap = 300 } = options;

  if (nodes.length === 0) return nodes;

  const nodeLevels = new Map<string, number>();

  const calculateLevel = (nodeId: string, visited: Set<string> = new Set()): number => {
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);

    const incomingConnections = connections.filter((conn) => conn.to === nodeId);
    if (incomingConnections.length === 0) {
      return 0;
    }

    let maxLevel = 0;
    incomingConnections.forEach((conn) => {
      const sourceLevel = calculateLevel(conn.from, visited);
      maxLevel = Math.max(maxLevel, sourceLevel + 1);
    });

    return maxLevel;
  };

  nodes.forEach((node) => {
    nodeLevels.set(node.id, calculateLevel(node.id));
  });

  const maxLevel = Math.max(...Array.from(nodeLevels.values()), 0);
  const levels: Node[][] = Array.from({ length: maxLevel + 1 }, () => []);

  nodes.forEach((node) => {
    const level = nodeLevels.get(node.id) || 0;
    levels[level].push(node);
  });

  const nodeHeight = nodes[0]?.height || 200;

  const arranged = nodes.map((node) => {
    const level = nodeLevels.get(node.id) || 0;
    const nodesInSameLevel = levels[level];
    const indexInLevel = nodesInSameLevel.findIndex((n) => n.id === node.id);

    const totalHeight = nodesInSameLevel.length * nodeHeight + (nodesInSameLevel.length - 1) * verticalGap;
    const startY = -totalHeight / 2;

    const newX = level * levelGap;
    const newY = startY + indexInLevel * (nodeHeight + verticalGap);

    return {
      ...node,
      x: newX,
      y: newY
    };
  });

  return arranged;
};

export const getNodesBounds = (nodes: Node[]) => {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  });

  return { minX, minY, maxX, maxY };
};