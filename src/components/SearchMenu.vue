<template>
  <Teleport to="body">
    <div v-if="visible" class="search-overlay" @click.self="close">
      <div class="search-container">
        <div class="search-header">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          <input
            v-model="query"
            type="text"
            placeholder="搜索节点..."
            class="search-input"
            @keyup.enter="handleEnter"
            @keyup.esc="close"
            ref="inputRef"
          />
          <kbd class="esc-hint">ESC</kbd>
        </div>
        <div v-if="filteredTypes.length > 0" class="search-results">
          <div
            v-for="(item, index) in filteredTypes"
            :key="item.type"
            class="search-result-item"
            :class="{ active: selectedIndex === index }"
            @click="select(item.type)"
            @mouseenter="selectedIndex = index"
          >
            <span class="result-icon">{{ item.icon }}</span>
            <span class="result-name">{{ item.name }}</span>
            <kbd class="enter-hint" v-if="selectedIndex === index">Enter</kbd>
          </div>
        </div>
        <div v-else class="search-empty">
          <span>未找到匹配的节点</span>
        </div>
        <div class="search-footer">
          <span class="hint"><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
          <span class="hint"><kbd>Enter</kbd> 创建</span>
          <span class="hint"><kbd>ESC</kbd> 关闭</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';

interface NodeType {
  type: 'input-image' | 'gen-image' | 'preview' | 'http' | 'js' | 'text' | 'ai';
  name: string;
  icon: string;
}

const nodeTypes: NodeType[] = [
  { type: 'input-image', name: '图片输入', icon: '🖼️' },
  { type: 'gen-image', name: '生成图片', icon: '✨' },
  { type: 'preview', name: '预览', icon: '👁️' },
  { type: 'http', name: 'HTTP请求', icon: '🌐' },
  { type: 'js', name: 'JavaScript', icon: '📜' },
  { type: 'text', name: '文本', icon: '📝' },
  { type: 'ai', name: 'AI', icon: '🤖' }
];

const visible = defineModel<boolean>('visible', { default: false });
const emit = defineEmits<{
  select: [type: NodeType['type']];
}>();

const query = ref('');
const selectedIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);

const filteredTypes = computed(() => {
  if (!query.value) return nodeTypes;
  const q = query.value.toLowerCase();
  return nodeTypes.filter(t => 
    t.name.toLowerCase().includes(q) || 
    t.type.toLowerCase().includes(q)
  );
});

watch(query, () => {
  selectedIndex.value = 0;
});

watch(visible, (val) => {
  if (val) {
    query.value = '';
    selectedIndex.value = 0;
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
});

const handleEnter = () => {
  if (filteredTypes.value.length > 0) {
    select(filteredTypes.value[selectedIndex.value].type);
  }
};

const select = (type: NodeType['type']) => {
  emit('select', type);
  close();
};

const close = () => {
  visible.value = false;
};

const handleKeydown = (e: KeyboardEvent) => {
  if (!visible.value) return;
  
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIndex.value = (selectedIndex.value + 1) % filteredTypes.value.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIndex.value = (selectedIndex.value - 1 + filteredTypes.value.length) % filteredTypes.value.length;
  }
};

defineExpose({
  handleKeydown
});
</script>

<style scoped>
.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  z-index: 9999;
}

.search-container {
  width: 480px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 
              0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  overflow: hidden;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.search-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  gap: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.search-icon {
  color: #64748b;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #f1f5f9;
  font-size: 16px;
  outline: none;
}

.search-input::placeholder {
  color: #64748b;
}

.esc-hint {
  background: rgba(100, 116, 139, 0.3);
  color: #94a3b8;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-family: inherit;
  border: 1px solid rgba(100, 116, 139, 0.3);
}

.search-results {
  max-height: 280px;
  overflow-y: auto;
  padding: 8px;
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 12px;
}

.search-result-item:hover,
.search-result-item.active {
  background: rgba(59, 130, 246, 0.15);
}

.search-result-item.active {
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
}

.result-icon {
  font-size: 18px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(148, 163, 184, 0.1);
  border-radius: 8px;
}

.result-name {
  flex: 1;
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 500;
}

.enter-hint {
  background: #3b82f6;
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-family: inherit;
}

.search-empty {
  padding: 32px 20px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
}

.search-footer {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.hint {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 12px;
}

.hint kbd {
  background: rgba(100, 116, 139, 0.3);
  color: #94a3b8;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-family: inherit;
  border: 1px solid rgba(100, 116, 139, 0.3);
}
</style>