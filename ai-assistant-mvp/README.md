# AI Assistant MVP

这是一个基于 Electron 和 Three.js 的 AI 虚拟助手最小可行原型。该项目使用 VRM 规范的角色模型，通过本地运行的 LM Studio 提供 AI 对话能力。

## 项目结构

```
ai-assistant-mvp/
├── public/                  # 静态资源
│   └── models/              # 3D模型文件
│       └── Lina_VRM.vrm     # VRM角色模型
├── src/
│   ├── constants/           # 常量定义
│   │   └── appConstants.js  # 应用配置常量
│   ├── main/                # Electron 主进程代码
│   │   └── main.js          # 主进程入口文件
│   ├── renderer/            # Electron 渲染进程代码
│   │   ├── components/      # UI组件
│   │   │   └── characterContainer.js  # 角色容器组件
│   │   ├── utils/           # 工具函数
│   │   └── renderer.js      # 渲染进程入口文件
│   ├── styles/              # 样式文件
│   │   └── styles.css       # 主样式文件
│   ├── shared/              # 主进程和渲染进程共享代码
│   └── preload.js           # Electron预加载脚本
├── index.html               # 主页面
├── package.json             # 项目配置和依赖
└── reinstall.bat            # 重新安装依赖脚本
```

## 技术栈

- Electron: 跨平台桌面应用框架
- Three.js: 3D图形库
- @pixiv/three-vrm: VRM角色模型加载和渲染库
- LM Studio: 本地大语言模型服务

## 安装和运行

1. 确保已安装 Node.js (推荐使用最新LTS版本)

2. 安装项目依赖:
   ```
   npm install
   ```

3. 启动 LM Studio 并加载一个模型（推荐使用 deepseek/deepseek-r1-0528-qwen3-8b）

4. 在 LM Studio 中开启 API 服务，确保端口为 1234

5. 启动应用:
   ```
   npm start
   ```

## 功能说明

- 3D虚拟角色展示: 使用 Three.js 和 @pixiv/three-vrm 渲染 VRM 角色模型
- AI对话功能: 通过 LM Studio API 实现本地 AI 对话
- 简单动画: 角色会根据用户交互播放简单动画

## 开发说明

- 主进程代码位于 `src/main/` 目录
- 渲染进程代码位于 `src/renderer/` 目录
- 样式文件位于 `src/styles/` 目录
- 静态资源位于 `public/` 目录
- 常量定义位于 `src/constants/` 目录

## 注意事项

- 确保 LM Studio 正在运行并在设置中开启了 API 服务
- 确保使用的模型与代码中配置的模型名称一致
- 如需更换模型，请修改 `src/constants/appConstants.js` 中的配置