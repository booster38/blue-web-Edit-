import { ref } from 'vue';
import type { Node } from '../types';

export function useNodes() {
  const nodes = ref<Node[]>([]);
  const selectedNodeId = ref<string | null>(null);
  const selectedNodeIds = ref<Set<string>>(new Set());
  const dragNodeId = ref<string | null>(null);
  const resizingNodeId = ref<string | null>(null);

  const addNode = (type: Node['type'], view?: { x: number; y: number; zoom: number }) => {
    // 默认视口中心位置，确保即使没有view参数也能在合理位置创建节点
    const defaultCenterX = window.innerWidth / 2;
    const defaultCenterY = window.innerHeight / 2;
    const viewportCenterX = view ? (-view.x / view.zoom + defaultCenterX / view.zoom) : defaultCenterX;
    const viewportCenterY = view ? (-view.y / view.zoom + defaultCenterY / view.zoom) : defaultCenterY;

    const newNode: Node = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: type === 'input-image' ? '图片输入' : type === 'gen-image' ? '生成图片' : type === 'http' ? 'HTTP请求' : type === 'js' ? 'JavaScript' : type === 'text' ? '文本' : type === 'ai' ? 'AI' : '预览',
      x: viewportCenterX + (Math.random() - 0.5) * 100,
      y: viewportCenterY + (Math.random() - 0.5) * 100,
      width: 280,
      height: type === 'http' || type === 'js' || type === 'ai' ? 280 : type === 'text' ? 200 : 200,
      method: type === 'http' ? 'GET' : undefined,
      code: type === 'js' ? '// 处理输入输出函数\n// 支持多参数：process(param1, param2, ...) 或 process(...params)\nfunction process(...params) {\n  // 处理逻辑\n  // params[0] - 输入框内容（如果有）\n  // params[1..n] - 连接节点的内容（按连接顺序）\n  return params;\n}\n\n// 执行函数\nprocess();' : undefined,
      baseUrl: type === 'ai' ? 'https://api.deepseek.com' : undefined,
      apiKey: type === 'ai' ? '' : undefined,
      model: type === 'ai' ? 'deepseek-chat' : undefined,
      prompt: type === 'ai' ? '' : undefined
    };
    nodes.value.push(newNode);
    selectedNodeId.value = newNode.id;
    selectedNodeIds.value = new Set([newNode.id]);
    return newNode;
  };

  const deleteNode = (nodeId: string) => {
    nodes.value = nodes.value.filter((node) => node.id !== nodeId);
    if (selectedNodeId.value === nodeId) {
      selectedNodeId.value = null;
    }
    selectedNodeIds.value.delete(nodeId);
  };

  const getNodeById = (nodeId: string) => {
    return nodes.value.find((node) => node.id === nodeId);
  };

  const updateNode = (nodeId: string, updates: Partial<Node>) => {
    nodes.value = nodes.value.map((node) => {
      if (node.id === nodeId) {
        return { ...node, ...updates };
      }
      return node;
    });
  };

  return {
    nodes,
    selectedNodeId,
    selectedNodeIds,
    dragNodeId,
    resizingNodeId,
    addNode,
    deleteNode,
    getNodeById,
    updateNode
  };
}
