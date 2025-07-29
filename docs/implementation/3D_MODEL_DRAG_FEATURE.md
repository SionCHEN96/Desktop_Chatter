# 3D模型拖拽移动窗口功能实现

## 功能概述

实现了通过拖拽3D模型来移动整个应用窗口位置的功能，提供了更直观和有趣的窗口操作体验。

## 实现方案

### 1. 前端实现 (CharacterContainer.js)

在3D模型容器中添加了鼠标事件监听器：

```javascript
// 拖拽相关变量
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// 初始化3D模型拖拽功能
function initModelDrag() {
  // 鼠标按下 - 开始拖拽
  characterContainer.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return; // 只响应左键
    isDragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    characterContainer.style.cursor = 'grabbing';
  });

  // 鼠标移动 - 计算移动增量并发送IPC请求
  document.addEventListener('mousemove', (event) => {
    if (!isDragging) return;
    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;
    window.electronAPI.moveWindow(deltaX, deltaY);
    dragStartX = event.clientX;
    dragStartY = event.clientY;
  });

  // 鼠标释放 - 结束拖拽
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      characterContainer.style.cursor = 'grab';
    }
  });
}
```

### 2. IPC通信 (preload.js)

添加了moveWindow方法到electronAPI：

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... 其他方法
  moveWindow: (deltaX, deltaY) => ipcRenderer.send('move-window', { deltaX, deltaY })
});
```

### 3. 主进程处理 (ipcService.js)

添加了move-window事件处理器：

```javascript
// 处理窗口移动
ipcMain.on('move-window', (event, { deltaX, deltaY }) => {
  this.windowService.moveWindow(deltaX, deltaY);
});
```

### 4. 窗口服务 (windowService.js)

实现了moveWindow方法：

```javascript
/**
 * 移动窗口位置
 * @param {number} deltaX - X轴移动距离
 * @param {number} deltaY - Y轴移动距离
 */
moveWindow(deltaX, deltaY) {
  if (this.mainWindow) {
    const [currentX, currentY] = this.mainWindow.getPosition();
    this.mainWindow.setPosition(currentX + deltaX, currentY + deltaY);
  }
}
```

### 5. 样式优化 (styles.css)

调整了原有的拖拽区域，避免与3D模型拖拽冲突：

```css
/* 拖拽区域样式 - 只覆盖右侧区域，避免与3D模型拖拽冲突 */
.drag-handle {
    position: absolute;
    top: 0;
    left: 50%;  /* 从50%开始，只覆盖右侧 */
    right: 0;
    height: 30px;
    -webkit-app-region: drag;
    cursor: move;
    z-index: 100;
}
```

## 功能特性

### ✅ 核心功能
- **左键拖拽**: 只响应鼠标左键，避免意外触发
- **实时移动**: 窗口跟随鼠标实时移动，无延迟
- **增量计算**: 使用移动增量而非绝对位置，避免窗口跳跃
- **视觉反馈**: 鼠标样式变化（grab → grabbing → grab）

### ✅ 兼容性
- **共存机制**: 与原有的窗口拖拽区域（右侧顶部）共存
- **无冲突**: 两种拖拽方式互不干扰
- **区域分离**: 左侧3D模型区域 + 右侧顶部区域

### ✅ 用户体验
- **直观操作**: 直接拖拽3D角色移动窗口，符合用户直觉
- **平滑移动**: 窗口移动平滑自然，无卡顿
- **即时响应**: 鼠标按下即开始响应，释放即停止

## 技术亮点

1. **简洁实现**: 核心代码不到50行，实现简洁高效
2. **事件分离**: 使用document级别的mousemove和mouseup事件，确保拖拽过程中鼠标移出容器也能正常工作
3. **增量更新**: 每次只发送移动增量，减少IPC通信开销
4. **样式优化**: 智能调整原有拖拽区域，实现功能共存

## 测试验证

创建了详细的测试文档 `tests/test_drag_functionality.html`，包含：

1. **基础功能测试**: 验证拖拽移动是否正常工作
2. **冲突检查测试**: 确认与原有拖拽功能无冲突
3. **边界情况测试**: 测试各种极端使用场景

## 使用方法

1. 启动AI伴侣应用
2. 等待3D模型加载完成
3. 将鼠标移动到左侧3D模型区域
4. 观察鼠标指针变为抓取手型（grab）
5. 按住鼠标左键并拖拽
6. 窗口将跟随鼠标移动
7. 释放鼠标左键完成移动

## 后续优化建议

1. **性能优化**: 可以添加拖拽频率限制，避免过于频繁的IPC通信
2. **边界检测**: 可以添加屏幕边界检测，防止窗口完全移出屏幕
3. **动画效果**: 可以添加窗口移动的缓动动画效果
4. **触摸支持**: 可以扩展支持触摸屏设备的拖拽操作

## 文件修改清单

- ✅ `src/core/character/CharacterContainer.js` - 添加拖拽事件监听
- ✅ `src/preload.js` - 添加moveWindow IPC方法
- ✅ `src/main/services/ipcService.js` - 添加move-window事件处理
- ✅ `src/main/services/windowService.js` - 添加moveWindow方法
- ✅ `src/styles/styles.css` - 调整拖拽区域样式
- ✅ `tests/test_drag_functionality.html` - 创建测试文档
- ✅ `docs/implementation/3D_MODEL_DRAG_FEATURE.md` - 创建功能文档
