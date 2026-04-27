import { ref } from 'vue';
import type { View } from '../types';

export function useView() {
  const view = ref<View>({ x: -50000, y: -50000, zoom: 1 });
  const isPanning = ref(false);
  const lastMousePos = ref({ x: 0, y: 0 });

  const handlePan = (deltaX: number, deltaY: number) => {
    view.value = {
      ...view.value,
      x: view.value.x + deltaX,
      y: view.value.y + deltaY
    };
  };

  const handleZoom = (mouseX: number, mouseY: number, zoomFactor: number) => {
    let newZoom = Math.min(Math.max(view.value.zoom * zoomFactor, 0.2), 3);
    const scale = newZoom / view.value.zoom;
    view.value = {
      zoom: newZoom,
      x: mouseX - (mouseX - view.value.x) * scale,
      y: mouseY - (mouseY - view.value.y) * scale
    };
  };

  const resetView = () => {
    view.value = { x: -50000, y: -50000, zoom: 1 };
  };

  const moveViewToNode = (nodeX: number, nodeY: number, nodeWidth: number, nodeHeight: number, canvasWidth: number, canvasHeight: number) => {
    const nodeCenterX = nodeX + nodeWidth / 2;
    const nodeCenterY = nodeY + nodeHeight / 2;
    const targetX = canvasWidth / 2 - nodeCenterX * view.value.zoom;
    const targetY = canvasHeight / 2 - nodeCenterY * view.value.zoom;
    view.value = {
      ...view.value,
      x: targetX,
      y: targetY
    };
  };

  return {
    view,
    isPanning,
    lastMousePos,
    handlePan,
    handleZoom,
    resetView,
    moveViewToNode
  };
}
