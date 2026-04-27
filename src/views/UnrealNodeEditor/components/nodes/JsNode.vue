<template>
  <div class="node-params">
    <input
      type="text"
      v-model="node.input"
      placeholder="输入数据"
      class="node-input"
      @mousedown.stop
      @dblclick.stop
    />
  </div>
  <textarea
    v-model="node.code"
    placeholder="// 处理输入输出函数
// 支持多参数：process(param1, param2, ...)
function process(...params) {
  // 处理逻辑
  // params[0] - 输入框内容（如果有）
  // params[1..n] - 连接节点的内容（按连接顺序）
  return params;
}

// 执行函数
process();"
    class="node-textarea"
    rows="6"
    @mousedown.stop
    @dblclick.stop
  ></textarea>
  <div class="node-http-actions">
    <button class="node-button" @click.stop="executeJsCode">执行</button>
  </div>
  <div v-if="node.content" class="node-http-response">
    <div class="http-response-label">输出:</div>
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
  (e: 'js-execute', nodeId: string): void;
}>();

const executeJsCode = () => {
  emit('js-execute', props.node.id);
};
</script>

<style scoped lang="scss" src="../../style.scss"></style>