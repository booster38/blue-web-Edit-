<template>
  <div class="unreal-node-editor">
    <SearchMenu
      v-model:visible="searchMenuVisible"
      @select="handleSearchSelect"
      ref="searchMenuRef"
    />

    <div
      ref="canvasRef"
      id="canvas-bg"
      class="canvas-bg"
      :class="{ 'alt-active': isAltKeyDown }"
      @mousedown="handleMouseDown"
      @mouseup="handleCanvasMouseUp"
      @wheel="handleWheel"
      @dblclick="handleDoubleClick"
    >
      <div
        class="viewport"
        :style="{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }"
      >
        <svg class="connections">
          <g v-for="connection in connections" :key="connection.id" class="connection-group">
            <path :d="getConnectionPath(connection, nodes)" class="connection-path" />
            <circle :cx="getConnectionEndX(connection, nodes)" :cy="getConnectionEndY(connection, nodes)" r="5" class="connection-end" />
            <circle :cx="getConnectionStartX(connection, nodes)" :cy="getConnectionStartY(connection, nodes)" r="5" class="connection-start" />
            <path
              :d="getConnectionPath(connection, nodes)"
              class="connection-hitarea"
              @click.stop="disconnectConnection(connection.id)"
            />
          </g>
          <path
            v-if="connectingSource || connectingTarget"
            :d="getTempConnectionPath(connectingSource, connectingTarget, nodes, mousePos)"
            class="temp-connection-path"
          />
        </svg>

        <NodeComponent
          v-for="node in nodes"
          :key="node.id"
          :node="node"
          :is-selected="selectedNodeIds.has(node.id)"
          :is-input-active="connectingTarget === node.id"
          :is-output-active="connectingSource === node.id"
          :is-connected="isInputConnected(node.id)"
          @node-mousedown="handleNodeMouseDown"
          @node-mouseup="handleNodeMouseUp"
          @context-menu="showContextMenu"
          @delete="deleteNode"
          @input-mousedown="handleInputMouseDown"
          @input-mouseup="handleInputMouseUp"
          @output-mousedown="handleOutputMouseDown"
          @output-mouseup="handleOutputMouseUp"
          @resize-mousedown="handleResizeMouseDown"
          @drop="handleDrop"
          @dragOver="handleDragOver"
          @dragLeave="handleDragLeave"
          @generate-image="generateImage"
          @http-request="handleHttpRequest"
          @js-execute="handleJsExecute"
          @ai-request="handleAIRequest"
        />

        <!-- 剪刀工具线 -->
        <svg v-if="isScissorToolActive" class="scissor-line">
          <line
            :x1="scissorLine.startX"
            :y1="scissorLine.startY"
            :x2="scissorLine.endX"
            :y2="scissorLine.endY"
            class="scissor-line-path"
          />
        </svg>
      </div>

      <!-- selection-box 使用屏幕坐标，放在 viewport 外部 -->
      <div
        v-if="isSelecting"
        class="selection-box"
        :style="{
          left: Math.min(selectionBox.startX, selectionBox.endX) + 'px',
          top: Math.min(selectionBox.startY, selectionBox.endY) + 'px',
          width: Math.abs(selectionBox.endX - selectionBox.startX) + 'px',
          height: Math.abs(selectionBox.endY - selectionBox.startY) + 'px'
        }"
      ></div>

      <!-- context-menu 使用屏幕坐标，放在 viewport 外部 -->
      <div
        v-if="contextMenu.visible"
        class="context-menu"
        :style="{
          left: contextMenu.x + 'px',
          top: contextMenu.y + 'px'
        }"
        @click.stop
      >
        <div class="context-menu-item" @click="deleteNode(contextMenu.nodeId)">
          删除节点
        </div>
      </div>
    </div>

    <div class="toolbar">
      <button class="tool-button" @click="addNode('input-image', view)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        图片输入
      </button>
      <button class="tool-button" @click="addNode('gen-image', view)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
          <path d="M2 17l10 5 10-5"></path>
          <path d="M2 12l10 5 10-5"></path>
        </svg>
        生成图片
      </button>
      <button class="tool-button" @click="addNode('preview', view)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        预览
      </button>
      <button class="tool-button" @click="handleArrange">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        整理
      </button>
      <button class="tool-button" @click="addNode('http', view)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
        </svg>
        HTTP
      </button>
      <button class="tool-button" @click="addNode('js', view)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
        JS
      </button>
      <button class="tool-button" @click="addNode('text', view)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        文本
      </button>
      <button class="tool-button" @click="addNode('ai', view)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        AI
      </button>
    </div>

    <!-- 对话侧边栏按钮 -->
    <button class="chat-sidebar-toggle" @click="toggleChatSidebar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
      </svg>
    </button>

    <!-- 节点列表侧边栏按钮 -->
    <button class="node-list-sidebar-toggle" @click="toggleNodeListSidebar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="9" y1="9" x2="15" y2="9"></line>
        <line x1="9" y1="13" x2="15" y2="13"></line>
        <line x1="9" y1="17" x2="13" y2="17"></line>
      </svg>
    </button>

    <!-- 节点列表侧边栏 -->
    <div class="node-list-sidebar" :class="{ 'open': nodeListSidebarOpen }">
      <div class="node-list-sidebar-header">
        <h3>节点列表</h3>
        <button class="close-button" @click="toggleNodeListSidebar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="node-list-sidebar-content">
        <div v-if="nodes.length === 0" class="node-list-empty">
          暂无节点
        </div>
        <div
          v-for="node in nodes"
          :key="node.id"
          class="node-list-item"
          @click="jumpToNode(node.id)"
        >
          <span class="node-list-item-icon">{{ node.type === 'input-image' ? '🖼️' : node.type === 'gen-image' ? '✨' : node.type === 'preview' ? '👁️' : node.type === 'http' ? '🌐' : node.type === 'js' ? '📜' : node.type === 'ai' ? '🤖' : '📝' }}</span>
          <span class="node-list-item-title">{{ node.title }}</span>
          <button class="node-list-item-jump" @click.stop="jumpToNode(node.id)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 对话侧边栏 -->
    <div class="chat-sidebar" :class="{ 'open': chatSidebarOpen }">
      <div class="chat-sidebar-header">
        <h3>对话</h3>
        <button class="close-button" @click="toggleChatSidebar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="chat-sidebar-content">
        <div class="chat-messages" ref="chatMessagesRef">
          <div v-for="(message, index) in aiServices.chatMessages.value" :key="index" :class="['chat-message', message.role]">
            <div class="message-content">
              <p>{{ message.content }}</p>
            </div>
          </div>
          <div v-if="aiServices.isLoading.value" class="chat-message bot loading">
            <div class="message-content">
              <div class="loading-indicator">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>
          </div>
        </div>
        <div class="chat-input-area">
          <input 
            v-model="chatInput" 
            type="text" 
            placeholder="输入消息..." 
            class="chat-input"
            @keyup.enter="sendMessage"
          />
          <button 
            class="send-button" 
            @click="sendMessage"
            :disabled="aiServices.isLoading.value || !chatInput.trim()"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import SearchMenu from '../../components/SearchMenu.vue';
import NodeComponent from './components/NodeComponent.vue';
import type { Node } from './types';
import { screenToWorld, getConnectionPath, getConnectionStartX, getConnectionStartY, getConnectionEndX, getConnectionEndY, getTempConnectionPath, arrangeNodes, getNodesBounds } from './utils';
import { useNodes } from './hooks/useNodes';
import { useConnections } from './hooks/useConnections';
import { useView } from './hooks/useView';
import { useNodeOperations } from './hooks/useNodeOperations';
import { useNodeServices } from './hooks/useNodeServices';
import { useAIServices, type NodeOperations } from './hooks/useAIServices';

// 初始化hooks
const { nodes, selectedNodeId, selectedNodeIds, dragNodeId, resizingNodeId, addNode, deleteNode: deleteNodeById, updateNode } = useNodes();
const { connections, connectingSource, connectingTarget, addConnection, deleteConnection, deleteConnectionsByNodeId, isInputConnected } = useConnections();
const { view, isPanning, lastMousePos, handlePan, handleZoom, moveViewToNode } = useView();
const { isDragging, isSelecting, selectionBox, isShiftKeyDown, isAltKeyDown, isScissorToolActive, scissorLine, mousePos, startSelection, updateSelection, endSelection, startScissorTool, updateScissorTool, endScissorTool, updateMousePosition } = useNodeOperations();
const { generateImage: generateImageService, sendHttpRequest: sendHttpRequestService, executeJsCode: executeJsCodeService, sendAIRequest: sendAIRequestService } = useNodeServices();

// 准备节点操作对象
const nodeOperations: NodeOperations = {
  nodes,
  addNode,
  updateNode,
  deleteNode: deleteNodeById,
  addConnection,
  deleteConnectionsByNodeId,
  view
};

// 初始化AI服务
const aiServices = useAIServices(nodeOperations);

// 上下文菜单状态
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  nodeId: ''
});

// 搜索菜单状态
const searchMenuVisible = ref(false);
const searchMenuRef = ref<InstanceType<typeof SearchMenu> | null>(null);

// 画布引用
const canvasRef = ref<HTMLElement | null>(null);

// 对话侧边栏状态
const chatSidebarOpen = ref(false);
const nodeListSidebarOpen = ref(false);

// 对话相关状态
const chatInput = ref('');
const chatMessagesRef = ref<HTMLElement | null>(null);

// 切换对话侧边栏
const toggleChatSidebar = () => {
  chatSidebarOpen.value = !chatSidebarOpen.value;
};

// 切换节点列表侧边栏
const toggleNodeListSidebar = () => {
  nodeListSidebarOpen.value = !nodeListSidebarOpen.value;
};

// 发送消息
const sendMessage = async () => {
  const message = chatInput.value.trim();
  if (!message || aiServices.isLoading.value) return;

  // 添加用户消息
  aiServices.addMessage('user', message);
  chatInput.value = '';
  
  // 滚动到最新消息
  scrollToBottom();
  
  try {
    // 调用AI服务，传入当前节点信息
    const history = aiServices.chatMessages.value.filter(m => m.role !== 'user');
    const response = await aiServices.sendChatMessage(message, history, nodes.value);
    
    // 检查是否包含工具调用
    if (response.includes('```javascript') || response.includes('createNode') || response.includes('createMultipleNodes') || response.includes('createNodeChain')) {
      // 尝试执行工具调用
      await handleToolCalls(response);
    } else {
      // 添加助手消息
      aiServices.addMessage('assistant', response);
    }
  } catch (error) {
    // 添加错误消息
    aiServices.addMessage('assistant', `抱歉，发生错误：${error instanceof Error ? error.message : '未知错误'}`);
  } finally {
    // 滚动到最新消息
    scrollToBottom();
  }
};

// 处理工具调用
const handleToolCalls = async (response: string) => {
  try {
    // 提取JavaScript代码
    const codeMatch = response.match(/```javascript([\s\S]*?)```/);
    if (codeMatch) {
      const code = codeMatch[1].trim();
      
      // 记录执行前的状态
      const nodesBefore = nodes.value.length;
      const connectionsBefore = connections.value.length;
      
      // 执行代码 - 使用Function构造函数创建安全的执行环境
      await new Function('createNode', 'createMultipleNodes', 'connectNodes', 'createNodeChain', 'clearAllNodes', 'getCurrentNodes', `
        return (async function() {
          ${code}
        })();
      `)(
        aiServices.tools.createNode,
        aiServices.tools.createMultipleNodes,
        aiServices.tools.connectNodes,
        aiServices.tools.createNodeChain,
        aiServices.tools.clearAllNodes,
        aiServices.tools.getCurrentNodes
      );
      
      // 根据状态变化生成结果消息
      const nodesAfter = nodes.value.length;
      const connectionsAfter = connections.value.length;
      
      let resultMessage = '操作已完成：';
      if (nodesAfter > nodesBefore) {
        const createdCount = nodesAfter - nodesBefore;
        resultMessage += `创建了${createdCount}个节点`;
      }
      if (connectionsAfter > connectionsBefore) {
        const connectedCount = connectionsAfter - connectionsBefore;
        if (resultMessage !== '操作已完成：') resultMessage += '，';
        resultMessage += `建立了${connectedCount}个连接`;
      }
      if (nodesAfter < nodesBefore) {
        const deletedCount = nodesBefore - nodesAfter;
        if (resultMessage !== '操作已完成：') resultMessage += '，';
        resultMessage += `删除了${deletedCount}个节点`;
      }
      if (nodesAfter === nodesBefore && connectionsAfter === connectionsBefore) {
        resultMessage = '操作已完成，未发生可见变化';
      }
      
      // 添加执行结果消息
      aiServices.addMessage('assistant', resultMessage);
    } else {
      // 添加原始消息
      aiServices.addMessage('assistant', response);
    }
  } catch (error) {
    aiServices.addMessage('assistant', `执行工具操作时出错：${error instanceof Error ? error.message : '未知错误'}`);
  }
};

// 滚动到最新消息
const scrollToBottom = () => {
  setTimeout(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
    }
  }, 100);
};

// 跳转到节点
const jumpToNode = (nodeId: string) => {
  const node = nodes.value.find(n => n.id === nodeId);
  if (node && canvasRef.value) {
    const canvasRect = canvasRef.value.getBoundingClientRect();
    moveViewToNode(node.x, node.y, node.width, node.height, canvasRect.width, canvasRect.height);
  }
};

// 删除节点
const deleteNode = (nodeId: string) => {
  deleteNodeById(nodeId);
  deleteConnectionsByNodeId(nodeId);
  closeContextMenu();
};

// 整理节点
const handleArrange = () => {
  // 只整理选中的节点，如果没有选中则整理所有节点
  const nodesToArrange = selectedNodeIds.value.size > 0 
    ? nodes.value.filter(node => selectedNodeIds.value.has(node.id))
    : nodes.value;
  
  if (nodesToArrange.length === 0) return;

  const arranged = arrangeNodes(nodesToArrange, connections.value);

  const bounds = getNodesBounds(arranged);
  const layoutCenterX = (bounds.minX + bounds.maxX) / 2;
  const layoutCenterY = (bounds.minY + bounds.maxY) / 2;

  const viewportCenterX = -view.value.x / view.value.zoom + window.innerWidth / 2 / view.value.zoom;
  const viewportCenterY = -view.value.y / view.value.zoom + window.innerHeight / 2 / view.value.zoom;

  const deltaX = viewportCenterX - layoutCenterX;
  const deltaY = viewportCenterY - layoutCenterY;

  // 更新节点位置
  nodes.value = nodes.value.map((node) => {
    const arrangedNode = arranged.find(n => n.id === node.id);
    if (arrangedNode) {
      return {
        ...node,
        x: arrangedNode.x + deltaX,
        y: arrangedNode.y + deltaY
      };
    }
    return node;
  });
};

// 鼠标按下事件处理
const handleMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return;

  const target = e.target as HTMLElement;
  if (
    target &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'BUTTON' ||
      target.isContentEditable ||
      target.closest('input, textarea, select, button, [contenteditable="true"]'))
  ) {
    return;
  }

  if (e.altKey || isAltKeyDown.value) {
    e.preventDefault();
    const worldPos = screenToWorld(e.clientX, e.clientY, view.value, canvasRef.value);
    startScissorTool(worldPos.x, worldPos.y);
    isPanning.value = false;
    endSelection();
    return;
  }

  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    const rect = canvasRef.value?.getBoundingClientRect();
    const startX = e.clientX - (rect?.left || 0);
    const startY = e.clientY - (rect?.top || 0);
    startSelection(startX, startY);
    isPanning.value = false;
    selectedNodeIds.value = new Set();
    selectedNodeId.value = null;
    return;
  }

  isPanning.value = true;
  endSelection();
  selectedNodeId.value = null;
  selectedNodeIds.value = new Set();
  lastMousePos.value = { x: e.clientX, y: e.clientY };
};

// 鼠标移动事件处理
const handleMouseMove = (e: MouseEvent) => {
  const { clientX, clientY } = e;
  const worldPos = screenToWorld(clientX, clientY, view.value, canvasRef.value);
  updateMousePosition(worldPos.x, worldPos.y);

  if (isScissorToolActive.value) {
    updateScissorTool(worldPos.x, worldPos.y);
    return;
  }

  if (isSelecting.value) {
    const rect = canvasRef.value?.getBoundingClientRect();
    const endX = clientX - (rect?.left || 0);
    const endY = clientY - (rect?.top || 0);
    updateSelection(endX, endY);

    const boxStartX = Math.min(selectionBox.value.startX, endX);
    const boxStartY = Math.min(selectionBox.value.startY, endY);
    const boxEndX = Math.max(selectionBox.value.startX, endX);
    const boxEndY = Math.max(selectionBox.value.startY, endY);

    const worldStart = screenToWorld(boxStartX + (rect?.left || 0), boxStartY + (rect?.top || 0), view.value, canvasRef.value);
    const worldEnd = screenToWorld(boxEndX + (rect?.left || 0), boxEndY + (rect?.top || 0), view.value, canvasRef.value);

    const selected = new Set<string>();
    nodes.value.forEach((node) => {
      const nodeRight = node.x + node.width;
      const nodeBottom = node.y + node.height;
      if (node.x < worldEnd.x && nodeRight > worldStart.x && node.y < worldEnd.y && nodeBottom > worldStart.y) {
        selected.add(node.id);
      }
    });
    selectedNodeIds.value = selected;
    return;
  }

  if (dragNodeId.value) {
    isDragging.value = true;
    const deltaX = e.movementX / view.value.zoom;
    const deltaY = e.movementY / view.value.zoom;

    if (selectedNodeIds.value.size > 1 && selectedNodeIds.value.has(dragNodeId.value)) {
      nodes.value = nodes.value.map((node) => {
        if (selectedNodeIds.value.has(node.id)) {
          return { ...node, x: node.x + deltaX, y: node.y + deltaY };
        }
        return node;
      });
    } else {
      nodes.value = nodes.value.map((node) => {
        if (node.id === dragNodeId.value) {
          return { ...node, x: node.x + deltaX, y: node.y + deltaY };
        }
        return node;
      });
    }
    return;
  }

  if (resizingNodeId.value) {
    const worldPos = screenToWorld(clientX, clientY, view.value, canvasRef.value);
    nodes.value = nodes.value.map((node) => {
      if (node.id === resizingNodeId.value) {
        return {
          ...node,
          width: Math.max(200, worldPos.x - node.x),
          height: Math.max(150, worldPos.y - node.y)
        };
      }
      return node;
    });
    return;
  }

  if (isPanning.value) {
    const dx = clientX - lastMousePos.value.x;
    const dy = clientY - lastMousePos.value.y;
    handlePan(dx, dy);
    lastMousePos.value = { x: clientX, y: clientY };
    return;
  }
};

// 鼠标抬起事件处理
const handleMouseUp = () => {
  if (isScissorToolActive.value) {
    // 检测并断开与剪刀线相交的连接线
    connections.value = connections.value.filter(connection => {
      const fromNode = nodes.value.find(n => n.id === connection.from);
      const toNode = nodes.value.find(n => n.id === connection.to);
      if (!fromNode || !toNode) return true;

      const startX = fromNode.x + fromNode.width;
      const startY = fromNode.y + fromNode.height / 2;
      const endX = toNode.x;
      const endY = toNode.y + toNode.height / 2;

      // 检查连接线与剪刀线是否相交
      return !doLinesIntersect(
        startX, startY, endX, endY,
        scissorLine.value.startX, scissorLine.value.startY, scissorLine.value.endX, scissorLine.value.endY
      );
    });

    endScissorTool();
    return;
  }

  if (isSelecting.value) {
    endSelection();
    if (selectedNodeIds.value.size === 1) {
      const nodeId = Array.from(selectedNodeIds.value)[0];
      selectedNodeId.value = nodeId;
    } else if (selectedNodeIds.value.size === 0) {
      selectedNodeId.value = null;
    }
  }

  if (isPanning.value) {
    isPanning.value = false;
  }

  dragNodeId.value = null;
  resizingNodeId.value = null;
  isDragging.value = false;
};

// 画布鼠标抬起事件处理
const handleCanvasMouseUp = (_e: MouseEvent) => {
  handleMouseUp();

  if (connectingSource.value || connectingTarget.value) {
    connectingSource.value = null;
    connectingTarget.value = null;
  }
};

// 鼠标滚轮事件处理
const handleWheel = (e: WheelEvent) => {
  // 检查事件是否来自可滚动元素或输入元素
  const target = e.target as HTMLElement;
  if (
    target &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable ||
      target.closest('input, textarea, select, [contenteditable="true"]') ||
      (target.scrollHeight > target.clientHeight && target.style.overflowY === 'auto') ||
      (target.scrollWidth > target.clientWidth && target.style.overflowX === 'auto'))
  ) {
    return;
  }

  // 如果剪刀工具激活，阻止缩放
  if (isScissorToolActive.value) {
    e.preventDefault();
    return;
  }

  if (e.ctrlKey) {
    e.preventDefault();
    return;
  }

  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
  handleZoom(mouseX, mouseY, zoomFactor);
};

// 双击事件处理
const handleDoubleClick = (_e: MouseEvent) => {};

// 显示上下文菜单
const showContextMenu = (nodeId: string, e: MouseEvent) => {
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    nodeId
  };

  setTimeout(() => {
    document.addEventListener('click', closeContextMenu);
  }, 10);
};

// 关闭上下文菜单
const closeContextMenu = () => {
  contextMenu.value.visible = false;
  document.removeEventListener('click', closeContextMenu);
};

// 显示搜索菜单
const showSearchMenu = () => {
  searchMenuVisible.value = true;
};

// 处理搜索选择
const handleSearchSelect = (type: Node['type']) => {
  addNode(type, view.value);
};

// 节点鼠标按下事件处理
const handleNodeMouseDown = (nodeId: string, e: MouseEvent) => {
  e.stopPropagation();
  if (isDragging.value) return;

  if (e.shiftKey || isShiftKeyDown.value) {
    if (selectedNodeIds.value.has(nodeId)) {
      selectedNodeIds.value.delete(nodeId);
      selectedNodeIds.value = new Set(selectedNodeIds.value);
    } else {
      selectedNodeIds.value.add(nodeId);
      selectedNodeIds.value = new Set(selectedNodeIds.value);
    }
    selectedNodeId.value = nodeId;
  } else {
    if (selectedNodeIds.value.has(nodeId) && selectedNodeIds.value.size > 1) {
      selectedNodeId.value = nodeId;
    } else {
      selectedNodeId.value = nodeId;
      selectedNodeIds.value = new Set([nodeId]);
    }
  }
  dragNodeId.value = nodeId;
  lastMousePos.value = { x: e.clientX, y: e.clientY };
};

// 节点鼠标抬起事件处理
const handleNodeMouseUp = (nodeId: string, e: MouseEvent) => {
  e.stopPropagation();

  if (connectingSource.value && connectingSource.value !== nodeId) {
    const updateInfo = addConnection(connectingSource.value, nodeId, nodes.value);
    if (updateInfo) {
      // 根据返回的属性来更新节点
      const updateData: any = {};
      if (updateInfo.url !== undefined) {
        updateData.url = updateInfo.url;
      } else if (updateInfo.content !== undefined) {
        updateData.content = updateInfo.content;
      }
      updateNode(updateInfo.nodeId, updateData);
    }
    connectingSource.value = null;
    connectingTarget.value = null;
  }

  if (connectingTarget.value && connectingTarget.value !== nodeId) {
    const updateInfo = addConnection(nodeId, connectingTarget.value, nodes.value);
    if (updateInfo) {
      // 根据返回的属性来更新节点
      const updateData: any = {};
      if (updateInfo.url !== undefined) {
        updateData.url = updateInfo.url;
      } else if (updateInfo.content !== undefined) {
        updateData.content = updateInfo.content;
      }
      updateNode(updateInfo.nodeId, updateData);
    }
    connectingSource.value = null;
    connectingTarget.value = null;
  }

  dragNodeId.value = null;
  resizingNodeId.value = null;
  isDragging.value = false;
};

// 输出端口鼠标按下事件处理
const handleOutputMouseDown = (nodeId: string, e: MouseEvent) => {
  e.stopPropagation();
  connectingSource.value = nodeId;
  connectingTarget.value = null;
};

// 输出端口鼠标抬起事件处理
const handleOutputMouseUp = (nodeId: string, e: MouseEvent) => {
  e.stopPropagation();

  if (connectingSource.value && connectingSource.value !== nodeId) {
    const updateInfo = addConnection(connectingSource.value, nodeId, nodes.value);
    if (updateInfo) {
      // 根据返回的属性来更新节点
      const updateData: any = {};
      if (updateInfo.url !== undefined) {
        updateData.url = updateInfo.url;
      } else if (updateInfo.content !== undefined) {
        updateData.content = updateInfo.content;
      }
      updateNode(updateInfo.nodeId, updateData);
    }
    connectingSource.value = null;
    connectingTarget.value = null;
  } else if (!connectingSource.value) {
    connectingSource.value = nodeId;
  }
};

// 输入端口鼠标按下事件处理
const handleInputMouseDown = (nodeId: string, e: MouseEvent) => {
  e.stopPropagation();
  connectingTarget.value = nodeId;
  connectingSource.value = null;
};

// 输入端口鼠标抬起事件处理
const handleInputMouseUp = (nodeId: string, e: MouseEvent) => {
  e.stopPropagation();

  if (connectingSource.value && connectingSource.value !== nodeId) {
    const updateInfo = addConnection(connectingSource.value, nodeId, nodes.value);
    if (updateInfo) {
      // 根据返回的属性来更新节点
      const updateData: any = {};
      if (updateInfo.url !== undefined) {
        updateData.url = updateInfo.url;
      } else if (updateInfo.content !== undefined) {
        updateData.content = updateInfo.content;
      }
      updateNode(updateInfo.nodeId, updateData);
    }
    connectingSource.value = null;
    connectingTarget.value = null;
  } else if (!connectingTarget.value) {
    connectingTarget.value = nodeId;
  }
};

// 调整大小鼠标按下事件处理
const handleResizeMouseDown = (nodeId: string, e: MouseEvent) => {
  e.stopPropagation();
  resizingNodeId.value = nodeId;
};

// 断开连接
const disconnectConnection = (connectionId: string) => {
  deleteConnection(connectionId);
};

// 处理拖放事件
const handleDrop = (nodeId: string, e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  // 移除拖拽状态
  if (e.currentTarget) {
    (e.currentTarget as HTMLElement).classList.remove('drag-over');
  }

  const files = Array.from(e.dataTransfer?.files || []);
  const imageFiles = files.filter((file) => file.type.startsWith('image/'));
  if (imageFiles.length > 0) {
    const file = imageFiles[0];
    const reader = new FileReader();
    
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      updateNode(nodeId, { content });
    };
    
    reader.onerror = () => {
      console.error('图片加载失败');
    };
    
    reader.readAsDataURL(file);
  }
};

// 处理拖拽悬停事件
const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  (e.currentTarget as HTMLElement)?.classList.add('drag-over');
};

// 处理拖拽离开事件
const handleDragLeave = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  (e.currentTarget as HTMLElement)?.classList.remove('drag-over');
};

// 生成图片
const generateImage = async (nodeId: string) => {
  const node = nodes.value.find((n) => n.id === nodeId);
  if (!node) return;

  try {
    const imageUrl = await generateImageService();
    updateNode(nodeId, { content: imageUrl });
  } catch (error) {
    updateNode(nodeId, { content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
};

// 发送HTTP请求
const handleHttpRequest = async (nodeId: string) => {
  const node = nodes.value.find((n) => n.id === nodeId);
  if (!node || !node.url) return;

  updateNode(nodeId, { content: 'loading...' });

  try {
    const response = await sendHttpRequestService(node);
    updateNode(nodeId, { content: response });
  } catch (error) {
    updateNode(nodeId, { content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
};

// 执行JavaScript代码
const handleJsExecute = (nodeId: string) => {
  const node = nodes.value.find((n) => n.id === nodeId);
  if (!node || !node.code) return;

  try {
    // 获取连接到当前节点的输入节点内容（多参数支持）
    const incomingConnections = connections.value.filter(conn => conn.to === nodeId);
    const params = [];
    
    // 如果有输入框内容，作为第一个参数
    if (node.input) {
      params.push(node.input);
    }
    
    // 收集所有连接节点的内容作为参数
    if (incomingConnections.length > 0) {
      for (const conn of incomingConnections) {
        const sourceNodeId = conn.from;
        const sourceNode = nodes.value.find(n => n.id === sourceNodeId);
        if (sourceNode) {
          // 根据节点类型获取相应的内容
          if (sourceNode.type === 'text') {
            params.push(sourceNode.text || '');
          } else {
            params.push(sourceNode.content || '');
          }
        }
      }
    }
    
    const result = executeJsCodeService(node, params);
    updateNode(nodeId, { content: result });
  } catch (error) {
    updateNode(nodeId, { content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
};

// 发送AI请求
const handleAIRequest = async (nodeId: string) => {
  const node = nodes.value.find((n) => n.id === nodeId);
  if (!node) return;

  updateNode(nodeId, { content: 'loading...' });

  // 获取提示词：如果有输入连接，则使用输入节点的内容；否则使用节点自己的prompt属性
  let prompt = node.prompt || '';
  const incomingConnections = connections.value.filter(conn => conn.to === nodeId);
  if (incomingConnections.length > 0) {
    for (const conn of incomingConnections) {
      const sourceNodeId = conn.from;
      const sourceNode = nodes.value.find(n => n.id === sourceNodeId);
      if (sourceNode) {
        // 根据源节点类型决定获取哪个属性
        if (sourceNode.type === 'text') {
          prompt = sourceNode.text || '';
        } else {
          prompt = sourceNode.content || '';
        }
        // 取第一个连接的输入作为提示词
        break;
      }
    }
  }

  if (!prompt || prompt.trim() === '') {
    const errorMessage = 'Error: No prompt provided';
    updateNode(nodeId, { content: errorMessage });
    return;
  }

  try {
    // 使用获取到的提示词发送请求
    const response = await sendAIRequestService({ ...node, prompt });
    updateNode(nodeId, { content: response });

    // 将结果传递给连接的目标节点
    const outgoingConnections = connections.value.filter(conn => conn.from === nodeId);
    if (outgoingConnections.length > 0) {
      for (const conn of outgoingConnections) {
        const targetNodeId = conn.to;
        const targetNode = nodes.value.find(n => n.id === targetNodeId);
        if (targetNode) {
          // 根据目标节点类型决定将内容放到哪个属性中
          if (targetNode.type === 'text') {
            // 对于文本节点，将内容放到text属性中
            updateNode(targetNodeId, { text: response });
          } else {
            // 对于其他节点，将内容放到content属性中
            updateNode(targetNodeId, { content: response });
          }
        }
      }
    }
  } catch (error) {
    const errorMessage = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    updateNode(nodeId, { content: errorMessage });

    // 将错误信息传递给连接的目标节点
    const outgoingConnections = connections.value.filter(conn => conn.from === nodeId);
    if (outgoingConnections.length > 0) {
      for (const conn of outgoingConnections) {
        const targetNodeId = conn.to;
        const targetNode = nodes.value.find(n => n.id === targetNodeId);
        if (targetNode) {
          if (targetNode.type === 'text') {
            updateNode(targetNodeId, { text: errorMessage });
          } else {
            updateNode(targetNodeId, { content: errorMessage });
          }
        }
      }
    }
  }
};

// 检测两条线段是否相交
const doLinesIntersect = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean => {
  const ccw = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): boolean => {
    return (y3 - y1) * (x2 - x1) > (y2 - y1) * (x3 - x1);
  };

  return (
    ccw(x1, y1, x3, y3, x4, y4) !== ccw(x2, y2, x3, y3, x4, y4) &&
    ccw(x1, y1, x2, y2, x3, y3) !== ccw(x1, y1, x2, y2, x4, y4)
  );
};

// 键盘按下事件处理
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'Space' && !((e.target as HTMLElement)?.closest('input, textarea, button'))) {
    e.preventDefault();
    showSearchMenu();
  }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    isShiftKeyDown.value = true;
  }
  if (e.code === 'AltLeft' || e.code === 'AltRight') {
    isAltKeyDown.value = true;
  }
  if (searchMenuVisible.value) {
    searchMenuRef.value?.handleKeydown(e);
  }
};

// 键盘抬起事件处理
const handleKeyUp = (e: KeyboardEvent) => {
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    isShiftKeyDown.value = false;
  }
  if (e.code === 'AltLeft' || e.code === 'AltRight') {
    isAltKeyDown.value = false;
    endScissorTool();
  }
};

// 生命周期钩子
onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
});
</script>

<style scoped lang="scss" src="./style.scss"></style>