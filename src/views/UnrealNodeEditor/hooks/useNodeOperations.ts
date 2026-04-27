import { ref } from 'vue';

export function useNodeOperations() {
  const isDragging = ref(false);
  const isSelecting = ref(false);
  const selectionBox = ref({ startX: 0, startY: 0, endX: 0, endY: 0 });
  const isShiftKeyDown = ref(false);
  const isAltKeyDown = ref(false);
  const isScissorToolActive = ref(false);
  const scissorLine = ref({ startX: 0, startY: 0, endX: 0, endY: 0 });
  const mousePos = ref({ x: 0, y: 0 });

  const startSelection = (x: number, y: number) => {
    isSelecting.value = true;
    selectionBox.value = { startX: x, startY: y, endX: x, endY: y };
  };

  const updateSelection = (x: number, y: number) => {
    if (isSelecting.value) {
      selectionBox.value = { ...selectionBox.value, endX: x, endY: y };
    }
  };

  const endSelection = () => {
    isSelecting.value = false;
  };

  const startScissorTool = (x: number, y: number) => {
    isScissorToolActive.value = true;
    scissorLine.value = { startX: x, startY: y, endX: x, endY: y };
  };

  const updateScissorTool = (x: number, y: number) => {
    if (isScissorToolActive.value) {
      scissorLine.value = { ...scissorLine.value, endX: x, endY: y };
    }
  };

  const endScissorTool = () => {
    isScissorToolActive.value = false;
  };

  const updateMousePosition = (x: number, y: number) => {
    mousePos.value = { x, y };
  };

  return {
    isDragging,
    isSelecting,
    selectionBox,
    isShiftKeyDown,
    isAltKeyDown,
    isScissorToolActive,
    scissorLine,
    mousePos,
    startSelection,
    updateSelection,
    endSelection,
    startScissorTool,
    updateScissorTool,
    endScissorTool,
    updateMousePosition
  };
}
