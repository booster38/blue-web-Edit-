<template>
  <div class="node-params">
    <select v-model="node.method" class="node-select" @mousedown.stop @dblclick.stop>
      <option value="GET">GET</option>
      <option value="POST">POST</option>
      <option value="PUT">PUT</option>
      <option value="DELETE">DELETE</option>
    </select>
    <input
      type="text"
      v-model="node.url"
      placeholder="输入URL"
      class="node-input"
      @mousedown.stop
      @dblclick.stop
    />
  </div>
  <textarea
    v-if="node.method === 'POST' || node.method === 'PUT'"
    v-model="node.body"
    placeholder="请求体 (JSON)"
    class="node-textarea"
    rows="3"
    @mousedown.stop
    @dblclick.stop
  ></textarea>
  <div class="node-http-actions">
    <button class="node-button" @click.stop="sendHttpRequest">发送</button>
  </div>
  <div v-if="node.content" class="node-http-response">
    <div class="http-response-label">响应:</div>
    <pre class="http-response-content">{{ node.content }}</pre>
  </div>
</template>

<script setup lang="ts">
import type { Node } from '../../types';

interface Props {
  node: Node;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'http-request', nodeId: string): void;
}>();

const sendHttpRequest = () => {
  emit('http-request', props.node.id);
};
</script>

<style scoped lang="scss" src="../../style.scss"></style>