import ImageInputNode from './nodes/ImageInputNode.vue';
import ImageGenNode from './nodes/ImageGenNode.vue';
import PreviewNode from './nodes/PreviewNode.vue';
import HttpNode from './nodes/HttpNode.vue';
import JsNode from './nodes/JsNode.vue';
import TextNode from './nodes/TextNode.vue';
import AINode from './nodes/AINode.vue';
import type { Node } from '../types';

export const getNodeComponent = (type: Node['type']) => {
  switch (type) {
    case 'input-image':
      return ImageInputNode;
    case 'gen-image':
      return ImageGenNode;
    case 'preview':
      return PreviewNode;
    case 'http':
      return HttpNode;
    case 'js':
      return JsNode;
    case 'text':
      return TextNode;
    case 'ai':
      return AINode;
    default:
      return PreviewNode;
  }
};
