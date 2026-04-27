<template>
  <div class="node-params">
    <div class="param-label">Base URL</div>
    <input
      type="text"
      v-model="node.baseUrl"
      placeholder="https://api.deepseek.com"
      class="node-input"
      @mousedown.stop
      @dblclick.stop
    />
    <div class="param-label">API Key</div>
    <input
      type="password"
      v-model="node.apiKey"
      placeholder="输入API Key"
      class="node-input"
      @mousedown.stop
      @dblclick.stop
    />
    <div class="param-label">Model</div>
    <input
      type="text"
      v-model="node.model"
      placeholder="deepseek-chat"
      class="node-input"
      @mousedown.stop
      @dblclick.stop
    />
  </div>
  <div class="node-prompt-section">
    <div class="param-label">Prompt</div>
    <textarea
      v-model="node.prompt"
      placeholder="输入提示词"
      class="node-textarea"
      rows="3"
      @mousedown.stop
      @dblclick.stop
    ></textarea>
  </div>
  <div class="node-ai-actions">
    <button class="node-button" @click.stop="sendAIRequest">发送</button>
  </div>
  <div v-if="node.content" class="node-ai-response">
    <div class="ai-response-label">响应:</div>
    <pre class="ai-response-content">{{ node.content }}</pre>
  </div>
</template>

<script setup lang="ts">
import type { Node } from '../../types';

interface Props {
  node: Node;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'ai-request', nodeId: string): void;
}>();

const sendAIRequest = () => {
  emit('ai-request', props.node.id);
};
</script>

<style scoped lang="scss" src="../../style.scss"></style>
