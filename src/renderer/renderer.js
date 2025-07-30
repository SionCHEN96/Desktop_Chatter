import { initCharacterContainer, playSimpleAnimation, playAnimation } from '../core/character/index.js';
import { App } from './components/App.js';
import { initMouseTrackingDebug } from '../utils/MouseTrackingDebug.js';

document.addEventListener('DOMContentLoaded', () => {
  // 初始化应用
  const app = new App();

  // 初始化鼠标跟踪调试工具
  initMouseTrackingDebug();

  // 将app实例挂载到全局对象，便于调试
  window.app = app;
})