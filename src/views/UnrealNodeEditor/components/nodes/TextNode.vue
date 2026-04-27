<template>
  <textarea
    v-model="node.text"
    placeholder="输入文本内容"
    class="node-textarea"
    rows="6"
    @mousedown.stop
    @dblclick.stop
  ></textarea>
</template>

<script setup lang="ts">
import type { Node } from '../../types';

interface Props {
  node: Node;
}

const props = defineProps<Props>();
</script>

<style scoped lang="scss" src="../../style.scss"></style>