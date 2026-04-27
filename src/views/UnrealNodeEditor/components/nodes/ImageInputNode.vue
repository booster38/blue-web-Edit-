<template>
  <div class="drop-zone" @drop="handleDrop($event)" @dragover="handleDragOver($event)" @dragleave="handleDragLeave($event)">
    <div v-if="!node.content" class="drop-zone-content">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
      <span>拖拽图片到此处</span>
    </div>
    <img v-if="node.content" :src="node.content" class="node-image" @dblclick.stop />
  </div>
</template>

<script setup lang="ts">
import type { Node } from '../../types';

interface Props {
  node: Node;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'drop', nodeId: string, event: DragEvent): void;
  (e: 'dragOver', event: DragEvent): void;
  (e: 'dragLeave', event: DragEvent): void;
}>();

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  emit('drop', props.node.id, event);
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  emit('dragOver', event);
};

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  emit('dragLeave', event);
};
</script>

<style scoped lang="scss" src="../../style.scss"></style>