<template>
  <div
    class="node-wrapper"
    :class="{ selected: isSelected, 'type-ai': node.type === 'ai' }"
    :style="{
      left: node.x + 'px',
      top: node.y + 'px',
      width: node.width + 'px',
      height: node.height + 'px'
    }"
    @mousedown="handleNodeMouseDown($event)"
    @mouseup="handleNodeMouseUp($event)"
    @contextmenu.prevent="showContextMenu($event)"
  >
    <div class="node-content">
      <div class="node-header">
        <span class="node-title">{{ node.title }}</span>
        <button class="node-close" @click.stop="deleteNode">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="node-body">
        <component
          :is="nodeComponent"
          :node="node"
          v-on="getComponentListeners(node.type)"
        />
      </div>
    </div>

    <div
      class="input-point"
      :class="{ connected: isConnected, active: isInputActive }"
      @mousedown.stop="handleInputMouseDown($event)"
      @mouseup.stop="handleInputMouseUp($event)"
    ></div>

    <div
      class="connector connector-right"
      :class="{ active: isOutputActive }"
      @mousedown.stop="handleOutputMouseDown($event)"
      @mouseup.stop="handleOutputMouseUp($event)"
    >
      <div class="connector-dot"></div>
    </div>

    <div class="resize-handle" @mousedown.stop="handleResizeMouseDown($event)"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Node } from '../types';
import { getNodeComponent } from './NodeFactory';

interface Props {
  node: Node;
  isSelected: boolean;
  isInputActive: boolean;
  isOutputActive: boolean;
  isConnected: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'node-mousedown', nodeId: string, event: MouseEvent): void;
  (e: 'node-mouseup', nodeId: string, event: MouseEvent): void;
  (e: 'context-menu', nodeId: string, event: MouseEvent): void;
  (e: 'delete', nodeId: string): void;
  (e: 'input-mousedown', nodeId: string, event: MouseEvent): void;
  (e: 'input-mouseup', nodeId: string, event: MouseEvent): void;
  (e: 'output-mousedown', nodeId: string, event: MouseEvent): void;
  (e: 'output-mouseup', nodeId: string, event: MouseEvent): void;
  (e: 'resize-mousedown', nodeId: string, event: MouseEvent): void;
  (e: 'drop', nodeId: string, event: DragEvent): void;
  (e: 'dragOver', event: DragEvent): void;
  (e: 'dragLeave', event: DragEvent): void;
  (e: 'generate-image', nodeId: string): void;
  (e: 'http-request', nodeId: string): void;
  (e: 'js-execute', nodeId: string): void;
  (e: 'ai-request', nodeId: string): void;
}>();

const nodeComponent = computed(() => getNodeComponent(props.node.type));

const getComponentListeners = (type: Node['type']) => {
  const listeners: Record<string, Function> = {};
  
  switch (type) {
    case 'input-image':
      listeners.drop = handleDrop;
      listeners.dragOver = handleDragOver;
      listeners.dragLeave = handleDragLeave;
      break;
    case 'gen-image':
      listeners['generate-image'] = generateImage;
      break;
    case 'http':
      listeners['http-request'] = sendHttpRequest;
      break;
    case 'js':
      listeners['js-execute'] = executeJsCode;
      break;
    case 'ai':
      listeners['ai-request'] = sendAIRequest;
      break;
    // 其他类型的节点不需要额外的事件监听器
  }
  
  return listeners;
};

const handleNodeMouseDown = (event: MouseEvent) => {
  emit('node-mousedown', props.node.id, event);
};

const handleNodeMouseUp = (event: MouseEvent) => {
  emit('node-mouseup', props.node.id, event);
};

const showContextMenu = (event: MouseEvent) => {
  emit('context-menu', props.node.id, event);
};

const deleteNode = () => {
  emit('delete', props.node.id);
};

const handleInputMouseDown = (event: MouseEvent) => {
  emit('input-mousedown', props.node.id, event);
};

const handleInputMouseUp = (event: MouseEvent) => {
  emit('input-mouseup', props.node.id, event);
};

const handleOutputMouseDown = (event: MouseEvent) => {
  emit('output-mousedown', props.node.id, event);
};

const handleOutputMouseUp = (event: MouseEvent) => {
  emit('output-mouseup', props.node.id, event);
};

const handleResizeMouseDown = (event: MouseEvent) => {
  emit('resize-mousedown', props.node.id, event);
};

const handleDrop = (...args: any[]) => {
  // 处理从ImageInputNode传递过来的参数
  let event: DragEvent;
  if (args.length === 1) {
    // 直接从DOM事件传递
    event = args[0];
  } else if (args.length === 2) {
    // 从子组件emit传递 (nodeId, event)
    event = args[1];
  } else {
    return;
  }
  
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
    event.stopPropagation();
  }
  
  // 始终传递当前节点的ID和事件对象
  emit('drop', props.node.id, event);
};

const handleDragOver = (...args: any[]) => {
  // 处理从ImageInputNode传递过来的参数
  let event: DragEvent;
  if (args.length === 1) {
    // 直接从DOM事件传递
    event = args[0];
  } else {
    // 从子组件emit传递 (event)
    event = args[0];
  }
  
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
    event.stopPropagation();
  }
  
  emit('dragOver', event);
};

const handleDragLeave = (...args: any[]) => {
  // 处理从ImageInputNode传递过来的参数
  let event: DragEvent;
  if (args.length === 1) {
    // 直接从DOM事件传递
    event = args[0];
  } else {
    // 从子组件emit传递 (event)
    event = args[0];
  }
  
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
    event.stopPropagation();
  }
  
  emit('dragLeave', event);
};

const generateImage = () => {
  emit('generate-image', props.node.id);
};

const sendHttpRequest = () => {
  emit('http-request', props.node.id);
};

const executeJsCode = () => {
  emit('js-execute', props.node.id);
};

const sendAIRequest = () => {
  emit('ai-request', props.node.id);
};
</script>

<style scoped lang="scss" src="../style.scss"></style>