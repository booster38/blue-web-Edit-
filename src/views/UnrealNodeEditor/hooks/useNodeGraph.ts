import { type Ref } from 'vue';
import type { Node, Connection } from '../types';
import { useNodes } from './useNodes';
import { useConnections } from './useConnections';
import { useNodeServices } from './useNodeServices';

export interface NodeGraphAPI {
  nodes: Ref<Node[]>;
  connections: Ref<Connection[]>;
  createNode: (type: Node['type'], options?: Partial<Node>) => Node;
  connectNodes: (fromNodeId: string, toNodeId: string) => boolean;
  executeNode: (nodeId: string) => Promise<any>;
  getNodeContent: (nodeId: string) => string | undefined;
  updateNodeContent: (nodeId: string, content: string) => void;
  deleteNode: (nodeId: string) => void;
  createTextNode: (content: string, x?: number, y?: number) => Node;
  createHttpNode: (url: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE', headers?: Record<string, string>, body?: string, x?: number, y?: number) => Node;
  createJsNode: (code: string, x?: number, y?: number) => Node;
  createImageInputNode: (content: string, x?: number, y?: number) => Node;
  createImageGenNode: (prompt?: string, x?: number, y?: number) => Node;
  createPreviewNode: (content?: string, x?: number, y?: number) => Node;
  createNodeChain: (chain: Array<{type: Node['type'], content?: string, url?: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE', headers?: Record<string, string>, body?: string, code?: string, prompt?: string, text?: string, x: number, y: number}>) => Node[];
  clearAll: () => void;
}

export function useNodeGraph(): NodeGraphAPI {
  const { nodes, addNode, deleteNode: deleteNodeById, updateNode, getNodeById } = useNodes();
  const { connections, addConnection, deleteConnectionsByNodeId } = useConnections();
  const { generateImage: generateImageService, sendHttpRequest: sendHttpRequestService, executeJsCode: executeJsCodeService } = useNodeServices();

  const createNode = (type: Node['type'], options?: Partial<Node>): Node => {
    const node = addNode(type);
    if (options) {
      updateNode(node.id, options);
    }
    return node;
  };

  const connectNodes = (fromNodeId: string, toNodeId: string): boolean => {
    const result = addConnection(fromNodeId, toNodeId, nodes.value);
    if (result) {
      updateNode(result.nodeId, result as Partial<Node>);
      return true;
    }
    return false;
  };

  const executeNode = async (nodeId: string): Promise<any> => {
    const node = getNodeById(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    switch (node.type) {
      case 'gen-image':
        return await generateImageService();
      case 'http':
        return await sendHttpRequestService(node);
      case 'js':
        const incomingConnections = connections.value.filter(conn => conn.to === nodeId);
        const params: any[] = [];
        for (const conn of incomingConnections) {
          const sourceNode = getNodeById(conn.from);
          if (sourceNode) {
            params.push(sourceNode.content || sourceNode.text || '');
          }
        }
        if (node.input) {
          params.unshift(node.input);
        }
        return executeJsCodeService(node, params);
      default:
        return node.content || node.text || '';
    }
  };

  const getNodeContent = (nodeId: string): string | undefined => {
    const node = getNodeById(nodeId);
    if (!node) return undefined;
    if (node.type === 'text') {
      return node.text;
    }
    return node.content;
  };

  const updateNodeContent = (nodeId: string, content: string): void => {
    const node = getNodeById(nodeId);
    if (!node) return;
    if (node.type === 'text') {
      updateNode(nodeId, { text: content });
    } else {
      updateNode(nodeId, { content });
    }
  };

  const deleteNode = (nodeId: string): void => {
    deleteNodeById(nodeId);
    deleteConnectionsByNodeId(nodeId);
  };

  const createTextNode = (content: string, x?: number, y?: number): Node => {
    const node = createNode('text', { text: content });
    if (x !== undefined) updateNode(node.id, { x });
    if (y !== undefined) updateNode(node.id, { y });
    return node;
  };

  const createHttpNode = (
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    headers?: Record<string, string>,
    body?: string,
    x?: number,
    y?: number
  ): Node => {
    const node = createNode('http', { url, method, headers, body });
    if (x !== undefined) updateNode(node.id, { x });
    if (y !== undefined) updateNode(node.id, { y });
    return node;
  };

  const createJsNode = (code: string, x?: number, y?: number): Node => {
    const node = createNode('js', { code });
    if (x !== undefined) updateNode(node.id, { x });
    if (y !== undefined) updateNode(node.id, { y });
    return node;
  };

  const createImageInputNode = (content: string, x?: number, y?: number): Node => {
    const node = createNode('input-image', { content });
    if (x !== undefined) updateNode(node.id, { x });
    if (y !== undefined) updateNode(node.id, { y });
    return node;
  };

  const createImageGenNode = (prompt?: string, x?: number, y?: number): Node => {
    const node = createNode('gen-image', { prompt });
    if (x !== undefined) updateNode(node.id, { x });
    if (y !== undefined) updateNode(node.id, { y });
    return node;
  };

  const createPreviewNode = (content?: string, x?: number, y?: number): Node => {
    const node = createNode('preview', { content });
    if (x !== undefined) updateNode(node.id, { x });
    if (y !== undefined) updateNode(node.id, { y });
    return node;
  };

  const createNodeChain = (
    chain: Array<{
      type: Node['type'];
      content?: string;
      url?: string;
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      headers?: Record<string, string>;
      body?: string;
      code?: string;
      prompt?: string;
      text?: string;
      x: number;
      y: number;
    }>
  ): Node[] => {
    const createdNodes: Node[] = [];

    for (const item of chain) {
      const nodeOptions: Partial<Node> = {};
      if (item.content !== undefined) nodeOptions.content = item.content;
      if (item.url !== undefined) nodeOptions.url = item.url;
      if (item.method !== undefined) nodeOptions.method = item.method;
      if (item.headers !== undefined) nodeOptions.headers = item.headers;
      if (item.body !== undefined) nodeOptions.body = item.body;
      if (item.code !== undefined) nodeOptions.code = item.code;
      if (item.prompt !== undefined) nodeOptions.prompt = item.prompt;
      if (item.text !== undefined) nodeOptions.text = item.text;

      const node = createNode(item.type, { ...nodeOptions, x: item.x, y: item.y });
      createdNodes.push(node);
    }

    for (let i = 0; i < createdNodes.length - 1; i++) {
      connectNodes(createdNodes[i].id, createdNodes[i + 1].id);
    }

    return createdNodes;
  };

  const clearAll = (): void => {
    const nodeIds = nodes.value.map(n => n.id);
    for (const nodeId of nodeIds) {
      deleteNode(nodeId);
    }
  };

  return {
    nodes,
    connections,
    createNode,
    connectNodes,
    executeNode,
    getNodeContent,
    updateNodeContent,
    deleteNode,
    createTextNode,
    createHttpNode,
    createJsNode,
    createImageInputNode,
    createImageGenNode,
    createPreviewNode,
    createNodeChain,
    clearAll
  };
}