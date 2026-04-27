---
name: "node-graph-tools"
description: "Provides tools for creating and managing node graphs. Invoke when user needs to create nodes, connect them, or build workflows."
---

# Node Graph Tools

This skill provides a set of tools for AI to create and manage node graphs in the Unreal Node Editor.

## Available Tools

### 1. createNode(type, options?)

**Description**: Creates a single node of the specified type.

**Parameters**:
- `type`: string - Node type (`text`, `http`, `js`, `input-image`, `gen-image`, `preview`)
- `options`: object (optional)
  - `x`: number - X coordinate (defaults to viewport position)
  - `y`: number - Y coordinate (defaults to viewport position)
  - `text`: string - Text content (for text nodes)
  - `url`: string - URL (for HTTP nodes)
  - `method`: string - HTTP method (for HTTP nodes)
  - `code`: string - JavaScript code (for JS nodes)
  - `prompt`: string - Image generation prompt (for gen-image nodes)

**Returns**: `{id: string, title: string}` - Created node information

**Example**:
```javascript
const node = await createNode('text', { text: 'Hello World' });
// Returns: {id: 'node_123', title: 'Text'}
```

### 2. createMultipleNodes(nodesConfig)

**Description**: Creates multiple nodes at once.

**Parameters**:
- `nodesConfig`: array - Array of node configurations
  - Each item: `{type, options}` - Same as createNode parameters

**Returns**: `Array<{id: string, title: string}>` - Array of created nodes

**Example**:
```javascript
const nodes = await createMultipleNodes([
  {type: 'text', options: {text: 'Hello'}}, 
  {type: 'http', options: {url: 'https://api.example.com'}}
]);
// Returns: [{id: 'node_123', title: 'Text'}, {id: 'node_456', title: 'HTTP'}]
```

### 3. connectNodes(fromNodeId, toNodeId)

**Description**: Connects two nodes.

**Parameters**:
- `fromNodeId`: string - Source node ID
- `toNodeId`: string - Target node ID

**Returns**: `boolean` - Success status

**Example**:
```javascript
const success = await connectNodes('node_123', 'node_456');
// Returns: true
```

### 4. createNodeChain(chainConfig)

**Description**: Creates a chain of nodes with automatic connections.

**Parameters**:
- `chainConfig`: array - Array of node configurations
  - Each item: `{type, options}` - Same as createNode parameters

**Returns**: `Array<{id: string, title: string}>` - Array of created nodes (connected in order)

**Example**:
```javascript
const nodes = await createNodeChain([
  {type: 'text', options: {text: 'Hello World'}},
  {type: 'js', options: {code: 'function process(input) { return input.toUpperCase(); }'}},
  {type: 'preview', options: {}}
]);
// Returns: [textNode, jsNode, previewNode] (connected in sequence)
```

### 5. clearAllNodes()

**Description**: Clears all nodes and connections.

**Returns**: `boolean` - Success status

**Example**:
```javascript
const success = await clearAllNodes();
// Returns: true
```

### 6. getCurrentNodes()

**Description**: Gets information about all current nodes.

**Returns**: `Array<{id: string, type: string, title: string, x: number, y: number, text?: string, url?: string, code?: string, prompt?: string}>` - Node information

**Example**:
```javascript
const nodes = await getCurrentNodes();
// Returns: [{id: 'node_123', type: 'text', title: 'Text', x: 100, y: 100, text: 'Hello World'}]
```

## Usage Guidelines

1. **Always check current nodes** before creating new ones to avoid duplicates
2. **Use viewport position** by default (omit x/y) for better user experience
3. **Connect nodes** in logical order (left to right)
4. **End chains** with preview nodes to show results
5. **Be specific** about node types and properties
6. **Handle errors** gracefully

## Common Scenarios

### Creating a simple text processing workflow
```javascript
const nodes = await createNodeChain([
  {type: 'text', options: {text: 'Hello World'}},
  {type: 'js', options: {code: 'function process(input) { return input.toUpperCase(); }'}},
  {type: 'preview', options: {}}
]);
```

### Creating an HTTP request workflow
```javascript
const nodes = await createMultipleNodes([
  {type: 'text', options: {text: 'API Response'}},
  {type: 'http', options: {url: 'https://api.deepseek.com/chat/completions', method: 'POST'}},
  {type: 'preview', options: {}}
]);
await connectNodes(nodes[1].id, nodes[2].id);
```

### Creating an image generation workflow
```javascript
const nodes = await createNodeChain([
  {type: 'text', options: {text: 'A beautiful sunset'}},
  {type: 'gen-image', options: {}},
  {type: 'preview', options: {}}
]);
```

## Decision Making

When to use each tool:
- **createNode**: For single node creation
- **createMultipleNodes**: For multiple unrelated nodes
- **createNodeChain**: For sequential processing workflows
- **connectNodes**: For manual connections between existing nodes
- **clearAllNodes**: When user wants to start fresh
- **getCurrentNodes**: To understand the current state before making changes

Always prioritize user experience by:
- Creating nodes in the visible viewport
- Using meaningful node properties
- Connecting nodes logically
- Providing clear feedback about operations