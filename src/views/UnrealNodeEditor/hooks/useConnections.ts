import { ref } from 'vue';
import type { Connection } from '../types';

export function useConnections() {
  const connections = ref<Connection[]>([]);
  const connectingSource = ref<string | null>(null);
  const connectingTarget = ref<string | null>(null);

  const addConnection = (from: string, to: string, nodes: Array<{ id: string; content?: string; text?: string; type: string }>) => {
    const exists = connections.value.some((c) => c.from === from && c.to === to);
    if (!exists) {
      connections.value.push({
        id: `conn-${Date.now()}`,
        from,
        to
      });
      
      // 自动传递数据：从源节点到目标节点
      const sourceNode = nodes.find(node => node.id === from);
      const targetNode = nodes.find(node => node.id === to);
      
      if (sourceNode && targetNode) {
        // 确定源节点的内容
        let sourceContent: string | undefined;
        if (sourceNode.type === 'text') {
          sourceContent = sourceNode.text;
        } else {
          sourceContent = sourceNode.content;
        }
        
        // 如果源节点有内容，传递给目标节点
        if (sourceContent) {
          // 根据目标节点类型决定将内容放到哪个属性中
          if (targetNode.type === 'http') {
            // 对于HTTP节点，将内容放到url属性中
            return {
              nodeId: targetNode.id,
              url: sourceContent
            };
          } else {
            // 对于其他节点，将内容放到content属性中
            return {
              nodeId: targetNode.id,
              content: sourceContent
            };
          }
        }
      }
    }
    return null;
  };

  const deleteConnection = (connectionId: string) => {
    connections.value = connections.value.filter((conn) => conn.id !== connectionId);
  };

  const deleteConnectionsByNodeId = (nodeId: string) => {
    connections.value = connections.value.filter((conn) => conn.from !== nodeId && conn.to !== nodeId);
  };

  const getIncomingConnections = (nodeId: string) => {
    return connections.value.filter((conn) => conn.to === nodeId);
  };

  const getOutgoingConnections = (nodeId: string) => {
    return connections.value.filter((conn) => conn.from === nodeId);
  };

  const isInputConnected = (nodeId: string) => {
    return connections.value.some((conn) => conn.to === nodeId);
  };

  return {
    connections,
    connectingSource,
    connectingTarget,
    addConnection,
    deleteConnection,
    deleteConnectionsByNodeId,
    getIncomingConnections,
    getOutgoingConnections,
    isInputConnected
  };
}
