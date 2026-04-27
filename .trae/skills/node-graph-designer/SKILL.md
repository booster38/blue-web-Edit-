---
name: "node-graph-designer"
description: "Designs and creates node graphs with connections for visual programming. Invoke when user wants to create nodes, connect them, or build workflows."
---

# Node Graph Designer

This skill helps AI design and create node graphs for the Unreal Node Editor visual programming system.

## When to Use

Invoke this skill when:
- User asks to create a node or workflow
- User wants to build a processing pipeline
- User describes a task that involves multiple processing steps
- User wants to connect nodes together
- User asks to implement a specific functionality using nodes

## Node Types Available

| Type | Description | Key Properties |
|------|-------------|----------------|
| `text` | Text content node | `text` - the text content |
| `input-image` | Image input node | `content` - image URL or base64 |
| `gen-image` | AI image generation | `prompt` - generation prompt |
| `http` | HTTP request node | `url`, `method`, `headers`, `body` |
| `js` | JavaScript execution | `code` - JS code with process() function |
| `preview` | Content preview | `content` - content to preview |

## API Reference

### Import
```typescript
import { useNodeGraph } from './views/UnrealNodeEditor/hooks/useNodeGraph';
const nodeGraph = useNodeGraph();
```

### Creating Nodes

```typescript
// Create any type of node with position
const node = nodeGraph.createNode(type, { x: 100, y: 200 });

// Create specific node types with helper methods
const textNode = nodeGraph.createTextNode("Hello World", x, y);
const httpNode = nodeGraph.createHttpNode("https://api.example.com", "GET", headers, body, x, y);
const jsNode = nodeGraph.createJsNode("function process(input) { return input.toUpperCase(); }", x, y);
const imageInputNode = nodeGraph.createImageInputNode("image_url_or_base64", x, y);
const imageGenNode = nodeGraph.createImageGenNode("a beautiful sunset", x, y);
const previewNode = nodeGraph.createPreviewNode("content to preview", x, y);
```

### Connecting Nodes

```typescript
// Connect two nodes (from -> to)
nodeGraph.connectNodes(sourceNodeId, targetNodeId);

// Check if input is connected
const isConnected = nodeGraph.isInputConnected(nodeId);
```

### Node Operations

```typescript
// Get node content
const content = nodeGraph.getNodeContent(nodeId);

// Update node content
nodeGraph.updateNodeContent(nodeId, "new content");

// Execute a node
const result = await nodeGraph.executeNode(nodeId);

// Delete a node
nodeGraph.deleteNode(nodeId);
```

### Creating Node Chains

```typescript
// Create multiple nodes and connect them in sequence
const nodes = nodeGraph.createNodeChain([
  { type: 'text', text: 'Hello', x: 100, y: 100 },
  { type: 'js', code: 'function process(input) { return input.toUpperCase(); }', x: 300, y: 100 },
  { type: 'preview', x: 500, y: 100 }
]);
// Nodes are automatically connected: text -> js -> preview
```

### Clearing All

```typescript
nodeGraph.clearAll();
```

## Node Properties

### Text Node
```typescript
{
  type: 'text',
  text: 'your text content here'
}
```

### Image Input Node
```typescript
{
  type: 'input-image',
  content: 'https://example.com/image.png' // or base64 data URL
}
```

### Image Generation Node
```typescript
{
  type: 'gen-image',
  prompt: 'a cute cat sitting on a windowsill'
}
```

### HTTP Request Node
```typescript
{
  type: 'http',
  url: 'https://api.example.com/endpoint',
  method: 'GET', // or 'POST', 'PUT', 'DELETE'
  headers: { 'Authorization': 'Bearer token' },
  body: '{"key": "value"}' // for POST/PUT
}
```

### JavaScript Node
```typescript
{
  type: 'js',
  code: `// 处理输入输出函数
// 支持多参数：process(param1, param2, ...) 或 process(...params)
function process(...params) {
  // params[0] - 输入框内容（如果有）
  // params[1..n] - 连接节点的内容（按连接顺序）
  return params;
}

// 执行函数
process();`
}
```

### Preview Node
```typescript
{
  type: 'preview',
  content: 'content to display'
}
```

## Usage Examples

### Example 1: Simple Text Processing Pipeline

```typescript
// Create a text processing chain
const textNode = nodeGraph.createTextNode("Hello World", 100, 100);
const jsNode = nodeGraph.createJsNode(`
function process(input) {
  return input.toUpperCase();
}
process();`, 300, 100);
const previewNode = nodeGraph.createPreviewNode("", 500, 100);

nodeGraph.connectNodes(textNode.id, jsNode.id);
nodeGraph.connectNodes(jsNode.id, previewNode.id);

// Execute
await nodeGraph.executeNode(previewNode.id);
```

### Example 2: HTTP API Chain

```typescript
// Create HTTP request chain
const httpNode = nodeGraph.createHttpNode(
  "https://api.deepseek.com/chat/completions",
  "POST",
  { "Content-Type": "application/json", "Authorization": "Bearer sk-xxx" },
  JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: "Hello" }] }),
  100, 100
);
const previewNode = nodeGraph.createPreviewNode("", 400, 100);

nodeGraph.connectNodes(httpNode.id, previewNode.id);
await nodeGraph.executeNode(previewNode.id);
```

### Example 3: Image Generation and Preview

```typescript
const promptNode = nodeGraph.createTextNode("a beautiful mountain landscape", 100, 100);
const genImageNode = nodeGraph.createImageGenNode("", 300, 100);
const previewNode = nodeGraph.createPreviewNode("", 500, 100);

nodeGraph.connectNodes(promptNode.id, genImageNode.id);
nodeGraph.connectNodes(genImageNode.id, previewNode.id);

await nodeGraph.executeNode(previewNode.id);
```

## Best Practices

1. **Position nodes with spacing**: Space nodes horizontally by ~200px for readability
2. **Connect in logical order**: Left to right flow for data processing
3. **Use preview nodes**: Always end chains with preview to see results
4. **Execute from end to start**: Data flows from source to target on execution
5. **Use appropriate node types**: Match node type to data type being processed

## Data Flow

- Nodes output data through their right connector
- Data enters target node through its left connector
- JavaScript nodes receive connected node contents as `params` array
- HTTP nodes auto-receive URL from connected text nodes
- Execute chain by calling `executeNode()` on the final node
