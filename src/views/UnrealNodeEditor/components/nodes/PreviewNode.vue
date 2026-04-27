<template>
  <div class="node-content-wrapper">
    <div v-if="node.content" class="preview-content">
      <img :src="node.content" class="node-image" @dblclick.stop />
      <button class="download-button" @click="downloadImage">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        下载
      </button>
    </div>
    <div v-else class="preview-placeholder"><span>预览窗口</span></div>
  </div>
</template>

<script setup lang="ts">
import type { Node } from '../../types';

interface Props {
  node: Node;
}

const props = defineProps<Props>();

const downloadImage = () => {
  if (!props.node.content) return;
  
  // 检查是否是DataURL
  if (props.node.content.startsWith('data:')) {
    // 创建下载链接
    const link = document.createElement('a');
    link.href = props.node.content;
    link.download = `preview-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else if (props.node.content.startsWith('http')) {
    // 对于网络图片，创建一个canvas来下载
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `preview-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
          }
        });
      }
    };
    img.src = props.node.content;
  }
};
</script>

<style scoped lang="scss" src="../../style.scss"></style>