import { initCharacterContainer, playSimpleAnimation, playAnimation } from '../core/character/index.js';
import { App } from './components/App.js';


document.addEventListener('DOMContentLoaded', () => {
  // 初始化应用
  const app = new App();



  // 将app实例挂载到全局对象，便于调试
  window.app = app;
})