<template>
  <div class="node-content-wrapper">
    <div class="node-params">
      <input
        type="text"
        v-model="node.prompt"
        placeholder="输入提示词"
        class="node-input"
        @mousedown.stop
        @dblclick.stop
      />
      <button class="node-button" @click.stop="generateImage">生成</button>
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
  (e: 'generate-image', nodeId: string): void;
}>();

const generateImage = () => {
  emit('generate-image', props.node.id);
};
</script>

<style scoped lang="scss" src="../../style.scss"></style>