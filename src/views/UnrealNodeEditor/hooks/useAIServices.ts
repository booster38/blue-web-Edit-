import { ref, type Ref } from 'vue';
import type { Node } from '../types';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface NodeToolOptions {
  x?: number;
  y?: number;
  text?: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  code?: string;
  prompt?: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface NodeInfo {
  id: string;
  title: string;
  type?: string;
  x?: number;
  y?: number;
  text?: string;
  url?: string;
  code?: string;
  prompt?: string;
}

export interface AIServices {
  // DeepSeek API 调用
  sendChatMessage: (message: string, history?: ChatMessage[], currentNodes?: Node[]) => Promise<string>;
  
  // 对话管理
  chatMessages: Ref<ChatMessage[]>;
  addMessage: (role: 'user' | 'assistant' | 'system', content: string) => void;
  clearMessages: () => void;
  
  // 工具函数（供AI调用）
  tools: {
    createNode: (type: Node['type'], options?: NodeToolOptions) => Promise<NodeInfo>;
    createMultipleNodes: (nodesConfig: Array<{type: Node['type'], options?: NodeToolOptions}>) => Promise<NodeInfo[]>;
    connectNodes: (fromNodeId: string, toNodeId: string) => Promise<{success: boolean, message?: string}>;
    createNodeChain: (chainConfig: Array<{type: Node['type'], options?: NodeToolOptions}>) => Promise<NodeInfo[]>;
    clearAllNodes: () => Promise<boolean>;
    getCurrentNodes: () => Promise<NodeInfo[]>;
  };
  
  // 节点操作相关的AI功能
  createNodeFromDescription: (description: string) => Promise<{ type: Node['type'], properties: Partial<Node> }>;
  generateNodeChain: (description: string) => Promise<Array<{ type: Node['type'], properties: Partial<Node>, x: number, y: number }>>;
  
  // 状态管理
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
}

export interface NodeOperations {
  nodes: Ref<Node[]>;
  addNode: (type: Node['type'], view: any) => Node;
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  deleteNode: (nodeId: string) => void;
  addConnection: (fromNodeId: string, toNodeId: string, nodes: Node[]) => any;
  deleteConnectionsByNodeId: (nodeId: string) => void;
  view: Ref<any>;
}

export function useAIServices(nodeOps?: NodeOperations): AIServices {
  const chatMessages = ref<ChatMessage[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // DeepSeek API 配置
  const API_CONFIG = {
    baseUrl: import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
    model: import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat'
  };

  // 发送聊天消息
  const sendChatMessage = async (message: string, history: ChatMessage[] = [], currentNodes: Node[] = []): Promise<string> => {
    isLoading.value = true;
    error.value = null;

    try {
      // 构建当前节点信息
      let currentNodesInfo = '';
      if (currentNodes.length > 0) {
        currentNodesInfo = '\n\n当前画布上的节点：\n' + currentNodes.map(n => {
          let info = `- ${n.title || n.type}节点 (ID: ${n.id})`;
          if (n.text) info += ` 内容: "${n.text}"`;
          if (n.content) info += ` 内容: "${n.content}"`;
          if (n.url) info += ` URL: "${n.url}"`;
          if (n.code) info += ` 代码: "${n.code.substring(0, 50)}..."`;
          if (n.prompt) info += ` Prompt: "${n.prompt}"`;
          return info;
        }).join('\n');
      }

      const systemPrompt = "你是一个节点图编辑器的助手，你可以帮助用户创建和管理节点。\n\n你可以使用以下工具函数来完成任务：\n\n1. **createNode(type, options?)** - 创建单个节点\n   - type: 'text', 'http', 'js', 'input-image', 'gen-image', 'preview'\n   - options: {x, y, text, url, method, code, prompt, headers, body}\n\n2. **createMultipleNodes(nodesConfig)** - 创建多个节点\n   - nodesConfig: [{type, options}, ...]\n\n3. **connectNodes(fromNodeId, toNodeId)** - 连接两个节点\n\n4. **createNodeChain(chainConfig)** - 创建节点链（自动连接）\n   - chainConfig: [{type, options}, ...]\n\n5. **clearAllNodes()** - 清空所有节点\n\n6. **getCurrentNodes()** - 获取当前所有节点信息\n\n使用示例：\n\`\`\`javascript\n// 创建文本节点\nconst node = await createNode('text', { text: 'Hello World' });\n\n// 创建节点链\nconst nodes = await createNodeChain([\n  {type: 'text', options: {text: 'Hello World'}},\n  {type: 'js', options: {code: 'function process(input) { return input.toUpperCase(); }'}},\n  {type: 'preview', options: {}}\n]);\n\`\`\`\n\n节点创建规则：\n- 节点默认会在用户当前视口内创建\n- 多个节点会自动水平排列，间距约200px\n- 你可以通过getCurrentNodes()了解当前画布状态\n\n当用户请求涉及节点操作时，你应该调用相应的工具函数来完成任务，然后告诉用户操作结果。\n\n如果用户的请求不需要节点操作，你应该正常回答用户的问题。" + currentNodesInfo;

      const requestBody = {
        model: API_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message }
        ],
        stream: false
      };

      const response = await fetch(`${API_CONFIG.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_CONFIG.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      return content;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      error.value = errorMessage;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 添加消息到历史记录
  const addMessage = (role: 'user' | 'assistant' | 'system', content: string) => {
    chatMessages.value.push({ role, content });
  };

  // 清空消息历史
  const clearMessages = () => {
    chatMessages.value = [];
  };

  // 从描述创建节点
  const createNodeFromDescription = async (description: string): Promise<{ type: Node['type'], properties: Partial<Node> }> => {
    isLoading.value = true;
    error.value = null;

    try {
      const prompt = `根据用户的描述，确定应该创建什么类型的节点，并提取相关属性。

用户描述：${description}

请返回JSON格式的结果，包含：
- type: 节点类型（input-image, gen-image, preview, text, http, js）
- properties: 节点的属性对象

例如：
{
  "type": "text",
  "properties": {
    "text": "Hello World"
  }
}`;

      const response = await sendChatMessage(prompt);
      
      // 提取JSON部分
      const jsonMatch = response.match(/```json([\s\S]*?)```/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1];
        const result = JSON.parse(jsonStr);
        return result;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      // 默认返回文本节点
      return {
        type: 'text',
        properties: {
          text: description
        }
      };
    } finally {
      isLoading.value = false;
    }
  };

  // 生成节点链
  const generateNodeChain = async (description: string): Promise<Array<{ type: Node['type'], properties: Partial<Node>, x: number, y: number }>> => {
    isLoading.value = true;
    error.value = null;

    try {
      const prompt = `根据用户的描述，生成一个节点链的配置。

用户描述：${description}

请返回JSON格式的结果，包含一个数组，每个元素代表一个节点：
- type: 节点类型（input-image, gen-image, preview, text, http, js）
- properties: 节点的属性对象
- x: x坐标
- y: y坐标

例如：
[
  {
    "type": "text",
    "properties": {
      "text": "Hello World"
    },
    "x": 100,
    "y": 100
  },
  {
    "type": "js",
    "properties": {
      "code": "function process(input) { return input.toUpperCase(); }"
    },
    "x": 300,
    "y": 100
  },
  {
    "type": "preview",
    "properties": {},
    "x": 500,
    "y": 100
  }
]`;

      const response = await sendChatMessage(prompt);
      
      // 提取JSON部分
      const jsonMatch = response.match(/```json([\s\S]*?)```/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1];
        const result = JSON.parse(jsonStr);
        return result;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      // 默认返回一个简单的节点链
      return [
        {
          type: 'text',
          properties: {
            text: description
          },
          x: 100,
          y: 100
        },
        {
          type: 'preview',
          properties: {},
          x: 300,
          y: 100
        }
      ];
    } finally {
      isLoading.value = false;
    }
  };

  // 工具函数实现
  const tools = {
    createNode: async (type: Node['type'], options: NodeToolOptions = {}): Promise<NodeInfo> => {
      if (!nodeOps) {
        throw new Error('Node operations not initialized');
      }
      
      const node = nodeOps.addNode(type, nodeOps.view.value);
      
      // 计算默认位置（基于视口）
      const viewportX = -nodeOps.view.value.x / nodeOps.view.value.zoom;
      const viewportY = -nodeOps.view.value.y / nodeOps.view.value.zoom;
      const x = options.x || (viewportX + 100 + Math.random() * 100);
      const y = options.y || (viewportY + 100 + Math.random() * 100);
      
      // 更新节点属性
      const updates: Partial<Node> = { x, y };
      if (options.text) updates.text = options.text;
      if (options.url) updates.url = options.url;
      if (options.method) updates.method = options.method;
      if (options.code) updates.code = options.code;
      if (options.prompt) updates.prompt = options.prompt;
      if (options.headers) updates.headers = options.headers;
      if (options.body) updates.body = options.body;
      
      nodeOps.updateNode(node.id, updates);
      
      return {
        id: node.id,
        title: node.title,
        type: node.type,
        x: x,
        y: y,
        text: options.text,
        url: options.url,
        code: options.code,
        prompt: options.prompt
      };
    },
    
    createMultipleNodes: async (nodesConfig: Array<{type: Node['type'], options?: NodeToolOptions}>): Promise<NodeInfo[]> => {
      if (!nodeOps) {
        throw new Error('Node operations not initialized');
      }
      
      const createdNodes: NodeInfo[] = [];
      const viewportX = -nodeOps.view.value.x / nodeOps.view.value.zoom;
      const viewportY = -nodeOps.view.value.y / nodeOps.view.value.zoom;
      
      nodesConfig.forEach((config, index) => {
        const options = config.options || {};
        const x = options.x || (viewportX + 100 + index * 200);
        const y = options.y || (viewportY + 100);
        
        const node = nodeOps.addNode(config.type, nodeOps.view.value);
        const updates: Partial<Node> = { x, y };
        
        if (options.text) updates.text = options.text;
        if (options.url) updates.url = options.url;
        if (options.method) updates.method = options.method;
        if (options.code) updates.code = options.code;
        if (options.prompt) updates.prompt = options.prompt;
        if (options.headers) updates.headers = options.headers;
        if (options.body) updates.body = options.body;
        
        nodeOps.updateNode(node.id, updates);
        
        createdNodes.push({
          id: node.id,
          title: node.title,
          type: node.type,
          x: x,
          y: y,
          text: options.text,
          url: options.url,
          code: options.code,
          prompt: options.prompt
        });
      });
      
      return createdNodes;
    },
    
    connectNodes: async (fromNodeId: string, toNodeId: string): Promise<{success: boolean, message?: string}> => {
      if (!nodeOps) {
        throw new Error('Node operations not initialized');
      }
      
      try {
        const result = nodeOps.addConnection(fromNodeId, toNodeId, nodeOps.nodes.value);
        if (result) {
          // 如果返回结果包含需要更新的节点信息，则更新节点
          if (result.nodeId) {
            const updates: Partial<Node> = {};
            if ('url' in result && result.url) {
              updates.url = result.url;
            }
            if ('content' in result && result.content) {
              updates.content = result.content;
            }
            if (Object.keys(updates).length > 0) {
              nodeOps.updateNode(result.nodeId, updates);
            }
          }
          return { success: true, message: '节点连接成功' };
        }
        return { success: false, message: '连接已存在或无效' };
      } catch (err) {
        return { success: false, message: err instanceof Error ? err.message : '连接失败' };
      }
    },
    
    createNodeChain: async (chainConfig: Array<{type: Node['type'], options?: NodeToolOptions}>): Promise<NodeInfo[]> => {
      if (!nodeOps) {
        throw new Error('Node operations not initialized');
      }
      
      const createdNodes = await tools.createMultipleNodes(chainConfig);
      
      // 连接节点
      for (let i = 0; i < createdNodes.length - 1; i++) {
        await tools.connectNodes(createdNodes[i].id, createdNodes[i + 1].id);
      }
      
      return createdNodes;
    },
    
    clearAllNodes: async (): Promise<boolean> => {
      if (!nodeOps) {
        throw new Error('Node operations not initialized');
      }
      
      try {
        const nodeIds = nodeOps.nodes.value.map(n => n.id);
        for (const nodeId of nodeIds) {
          nodeOps.deleteNode(nodeId);
          nodeOps.deleteConnectionsByNodeId(nodeId);
        }
        return true;
      } catch {
        return false;
      }
    },
    
    getCurrentNodes: async (): Promise<NodeInfo[]> => {
      if (!nodeOps) {
        throw new Error('Node operations not initialized');
      }
      
      return nodeOps.nodes.value.map(node => ({
        id: node.id,
        title: node.title,
        type: node.type,
        x: node.x,
        y: node.y,
        text: node.text,
        url: node.url,
        code: node.code,
        prompt: node.prompt
      }));
    }
  };

  return {
    sendChatMessage,
    chatMessages,
    addMessage,
    clearMessages,
    tools,
    createNodeFromDescription,
    generateNodeChain,
    isLoading,
    error
  };
}