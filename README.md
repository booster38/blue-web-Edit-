# Blue Web - 可视化节点图编辑器

一个基于 **Vue 3 + Vite + TypeScript** 构建的**可视化节点图编辑器**，灵感来源于 Unreal Engine 的蓝图系统。用户可以通过拖拽节点、连接节点的方式，构建数据处理工作流。

## 🎯 核心功能

### 节点类型

| 节点类型 | 图标 | 功能描述 |
|---------|------|---------|
| **图片输入** 🖼️ | `input-image` | 拖入图片，作为工作流的输入源 |
| **生成图片** ✨ | `gen-image` | 根据提示词生成随机图片（使用 picsum.photos） |
| **预览** 👁️ | `preview` | 预览并下载图片结果 |
| **HTTP请求** 🌐 | `http` | 发送 HTTP 请求（支持 GET/POST/PUT/DELETE） |
| **JavaScript** 📜 | `js` | 执行自定义 JavaScript 代码，支持多参数输入 |
| **文本** 📝 | `text` | 输入文本内容 |
| **AI** 🤖 | `ai` | 调用 AI API（如 DeepSeek），支持自定义 Base URL、API Key 和 Model |

### 交互特性

- **节点拖拽**：自由拖动节点，调整位置
- **节点连接**：通过输入/输出端口连接节点，形成数据流
- **多选操作**：按住 `Ctrl` 框选多个节点，按住 `Shift` 点选多个节点
- **剪刀工具**：按住 `Alt` 拖拽划线，可批量断开连接线
- **画布操作**：鼠标拖拽平移画布，滚轮缩放
- **节点整理**：一键自动排列节点布局
- **节点调整**：拖拽右下角调整节点大小
- **搜索创建**：按 `Space` 键快速搜索并创建节点
- **右键菜单**：右键节点可删除

### AI 对话集成

- 内置 AI 对话侧边栏，支持与 DeepSeek API 交互
- AI 可以通过自然语言指令自动创建、连接节点（如："创建一个文本节点，内容为 Hello World，再连接一个 JS 节点"）
- 支持节点链创建、批量操作等高级功能

### 数据流

节点之间通过连接线传递数据：
- 源节点的输出内容会自动传递给目标节点
- HTTP 节点接收 URL 参数，JS 节点接收多参数输入
- AI 节点支持从上游节点获取提示词

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 🛠️ 技术栈

- **Vue 3** - 组合式 API + `<script setup>`
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **SCSS** - 样式预处理
- **DeepSeek API** - AI 对话集成

## 📁 项目结构

```
src/
├── App.vue                          # 根组件
├── main.ts                          # 入口文件
├── style.css                        # 全局样式
├── components/
│   └── SearchMenu.vue               # 搜索菜单组件
└── views/
    └── UnrealNodeEditor/            # 核心编辑器
        ├── index.vue                # 主编辑器组件
        ├── style.scss               # 编辑器样式
        ├── types.ts                 # 类型定义
        ├── utils.ts                 # 工具函数
        ├── components/
        │   ├── NodeComponent.vue    # 节点容器组件
        │   ├── NodeFactory.ts       # 节点工厂
        │   └── nodes/               # 各类型节点组件
        │       ├── AINode.vue
        │       ├── HttpNode.vue
        │       ├── ImageGenNode.vue
        │       ├── ImageInputNode.vue
        │       ├── JsNode.vue
        │       ├── PreviewNode.vue
        │       └── TextNode.vue
        └── hooks/                   # 组合式逻辑
            ├── useNodes.ts          # 节点状态管理
            ├── useConnections.ts    # 连接状态管理
            ├── useView.ts           # 视图/画布控制
            ├── useNodeOperations.ts # 节点操作（选择、剪刀工具等）
            ├── useNodeServices.ts   # 节点服务（HTTP、JS执行、AI请求）
            ├── useAIServices.ts     # AI对话服务
            └── useNodeGraph.ts      # 节点图高级API
```

## 🔧 环境变量

如需使用 AI 对话功能，可配置以下环境变量（创建 `.env` 文件）：

```env
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com
VITE_DEEPSEEK_API_KEY=your_api_key_here
VITE_DEEPSEEK_MODEL=deepseek-chat
```

> 注意：项目中 `useNodeServices.ts` 内嵌了一个测试用的 API Key，建议替换为你自己的 Key。

## 🎨 设计风格

- 深色主题，灵感来自现代 IDE 和 Unreal Engine 编辑器
- 网格背景画布，支持无限平移和缩放
- 贝塞尔曲线连接线，视觉流畅
- 毛玻璃效果的搜索弹窗
- 响应式侧边栏设计
