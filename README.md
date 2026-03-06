# PDF Squeezer

PDF Squeezer 是一个基于 Electron 和 Vue 3 开发的 PDF 文件压缩工具，使用 Ghostscript 实现高质量的 PDF 压缩。

## 功能特性

- 📁 支持拖拽上传 PDF 文件
- 🖱️ 支持点击上传 PDF 文件
- ⚙️ 可调节压缩质量
- 📤 自动保存压缩后的文件
- 🎨 简洁美观的用户界面

## 技术栈

- **前端框架**：Vue 3 + TypeScript
- **UI 组件库**：Element Plus
- **构建工具**：Vite
- **桌面应用框架**：Electron
- **PDF 处理**：Ghostscript

## 安装说明

### 环境要求

- Node.js >= 20.19.0 或 >= 22.12.0
- npm 或 yarn

### 安装步骤

1. 克隆项目到本地

```bash
git clone <repository-url>
cd pdf-squeezer
```

2. 安装依赖

```bash
npm install
```

3. 运行开发模式

```bash
npm run electron:dev
```

4. 构建应用

```bash
npm run electron:build
```

## 使用方法

1. **上传 PDF 文件**：
   - 点击拖拽区域上传文件
   - 或直接拖拽 PDF 文件到应用窗口

2. **设置输出文件夹**：
   - 点击右上角设置图标
   - 在设置对话框中选择输出文件夹

3. **开始压缩**：
   - 点击「开始压缩」按钮
   - 等待压缩完成

4. **查看结果**：
   - 压缩完成后，文件会保存到指定的输出文件夹

## 压缩质量设置

在设置对话框中，您可以选择不同的压缩质量级别：

- **屏幕**：最小文件大小，适合屏幕查看
- **电子书**：平衡大小和质量，适合电子书
- **打印**：较高质量，适合打印
- **预设**：最高质量，保留原始文件质量

## 项目结构

```
pdf-squeezer/
├── core/            # Ghostscript 相关文件
├── electron/        # Electron 主进程和工具
│   ├── util/        # 工具函数
│   │   └── pdf-editor.ts  # PDF 处理逻辑
│   ├── main.ts      # Electron 主进程
│   └── preload.ts   # 预加载脚本
├── src/             # 前端代码
│   ├── router/      # 路由配置
│   ├── stores/      # 状态管理
│   ├── views/       # 页面组件
│   │   ├── components/  # 子组件
│   │   └── Home.vue     # 主页面
│   ├── App.vue      # 根组件
│   └── main.ts      # 前端入口
├── package.json     # 项目配置
└── vite.config.ts   # Vite 配置
```

## 核心功能实现

PDF 压缩功能通过调用 Ghostscript 命令行工具实现：

1. 将上传的 PDF 文件转换为 Buffer
2. 创建临时文件并写入 Buffer
3. 执行 Ghostscript 命令进行压缩
4. 将压缩后的文件保存到指定位置
5. 删除临时文件

## 开发指南

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 Vue 3 Composition API 风格
- 使用 SCSS 进行样式管理

### 调试技巧

- 开发模式下，Vue DevTools 可用
- Electron 主进程日志可在终端查看
- 渲染进程日志可在浏览器开发者工具查看

## 许可证

MIT License

## 致谢

- [Vue 3](https://vuejs.org/)
- [Electron](https://www.electronjs.org/)
- [Ghostscript](https://www.ghostscript.com/)
- [Element Plus](https://element-plus.org/)

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

---

**PDF Squeezer** - 让 PDF 文件更轻盈 🎉