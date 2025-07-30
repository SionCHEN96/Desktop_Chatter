/**
 * 鼠标跟踪调试工具
 * 用于显示鼠标跟踪状态和调试信息
 */

import { getMouseTrackingStatus } from '../core/character/CharacterContainer.js';

export class MouseTrackingDebug {
  constructor() {
    this.debugElement = null;
    this.isVisible = false;
    this.updateInterval = null;
    
    this.init();
  }

  /**
   * 初始化调试界面
   */
  init() {
    // 创建调试信息显示元素
    this.debugElement = document.createElement('div');
    this.debugElement.id = 'mouse-tracking-debug';
    this.debugElement.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      z-index: 1000;
      display: none;
      min-width: 200px;
    `;
    
    document.body.appendChild(this.debugElement);
    
    // 添加键盘快捷键切换显示
    document.addEventListener('keydown', (event) => {
      if (event.key === 'F12' && event.ctrlKey) {
        event.preventDefault();
        this.toggle();
      }
    });
  }

  /**
   * 切换调试信息显示
   */
  toggle() {
    this.isVisible = !this.isVisible;
    
    if (this.isVisible) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * 显示调试信息
   */
  show() {
    this.debugElement.style.display = 'block';
    this.startUpdating();
    console.log('鼠标跟踪调试信息已显示 (Ctrl+F12 切换)');
  }

  /**
   * 隐藏调试信息
   */
  hide() {
    this.debugElement.style.display = 'none';
    this.stopUpdating();
  }

  /**
   * 开始更新调试信息
   */
  startUpdating() {
    this.updateInterval = setInterval(() => {
      this.updateDebugInfo();
    }, 100); // 每100ms更新一次
  }

  /**
   * 停止更新调试信息
   */
  stopUpdating() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * 更新调试信息内容
   */
  updateDebugInfo() {
    try {
      const status = getMouseTrackingStatus();
      
      const debugInfo = `
<strong>🎯 鼠标跟踪调试信息</strong>
<hr style="margin: 5px 0; border: 1px solid #444;">
<strong>状态:</strong> ${status.enabled ? '✅ 启用' : '❌ 禁用'}
<strong>鼠标位置:</strong>
  X: ${status.mousePosition.x.toFixed(3)}
  Y: ${status.mousePosition.y.toFixed(3)}

<strong>骨骼检测:</strong>
  头部骨骼: ${status.hasHeadBone ? '✅ 已找到' : '❌ 未找到'}
  颈部骨骼: ${status.hasNeckBone ? '✅ 已找到' : '❌ 未找到'}
  眼部骨骼: ${status.eyeBonesCount} 个

<strong>控制:</strong>
  Ctrl+F12: 切换调试信息
  鼠标移动: 角色跟随
  鼠标离开: 回到默认位置
      `.trim();
      
      this.debugElement.innerHTML = debugInfo;
    } catch (error) {
      this.debugElement.innerHTML = `
<strong>🎯 鼠标跟踪调试信息</strong>
<hr style="margin: 5px 0; border: 1px solid #444;">
<span style="color: #ff6b6b;">错误: ${error.message}</span>
<br><br>
<strong>控制:</strong>
Ctrl+F12: 切换调试信息
      `;
    }
  }

  /**
   * 清理资源
   */
  dispose() {
    this.stopUpdating();
    
    if (this.debugElement && this.debugElement.parentNode) {
      this.debugElement.parentNode.removeChild(this.debugElement);
    }
  }
}

// 创建全局调试实例
let debugInstance = null;

/**
 * 初始化鼠标跟踪调试工具
 */
export function initMouseTrackingDebug() {
  if (!debugInstance) {
    debugInstance = new MouseTrackingDebug();
    console.log('鼠标跟踪调试工具已初始化，按 Ctrl+F12 显示调试信息');
  }
  return debugInstance;
}

/**
 * 获取调试实例
 */
export function getDebugInstance() {
  return debugInstance;
}
