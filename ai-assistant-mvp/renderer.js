import * as THREE from '../node_modules/three/build/three.module.js';
import { initCharacterContainer, characterContainer, scene, camera, cube } from './character-container.js';

document.addEventListener('DOMContentLoaded', () => {
  // 初始化3D角色
  const { sendMessage, onResponse } = window.electronAPI;
  const containerInfo = initCharacterContainer();

  const chatForm = document.getElementById('chat-form')
  const messageInput = document.getElementById('message-input')
  const chatMessages = document.getElementById('chat-messages')

  // 添加关闭按钮事件监听
  const closeButton = document.getElementById('close-button')
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      window.electronAPI.closeWindow()
    })
  }

  // 处理消息发送
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const message = messageInput.value.trim()
    if (message) {
      addMessage('user', message)
      window.electronAPI.sendMessage(message)
      messageInput.value = ''
    }
  })

  // 添加消息气泡样式
  const style = document.createElement('style');
  style.textContent = `
    .message.ai {
      background: rgba(255, 255, 255, 0.9);
      color: #333;
      padding: 10px 15px;
      border-radius: 18px;
      max-width: 200px;
      word-wrap: break-word;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      font-size: 14px;
      transform: translateY(-100%);
      transition: opacity 0.3s;
    }
    .message.ai.fade-out {
      opacity: 0;
    }
  `;
  document.head.appendChild(style);

  // 添加消息到3D立方体上方
  function addMessage(sender, text) {
    if (sender === 'user') {
      // 用户消息不显示，但保留发送功能
      return;
    }

    // 确保3D对象已初始化
    if (!cube || !camera || !characterContainer) {
      console.error('3D对象未初始化');
      return;
    }

    // 清除之前的AI消息
    const aiMessages = characterContainer.querySelectorAll('.message.ai');
    aiMessages.forEach(msg => msg.remove());

    // 创建消息气泡
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    messageElement.textContent = text;
    characterContainer.appendChild(messageElement);

    // 计算球体在屏幕上的位置
    function updateBubblePosition() {
      // 获取立方体顶部位置（Y轴减少立方体半径）
      const cubePosition = new THREE.Vector3(0, 0.3, 0); // 减少Y轴偏移量
      cubePosition.applyMatrix4(cube.matrixWorld);
      cubePosition.project(camera);

      // 转换为CSS坐标（调整Y轴系数）
      const x = (cubePosition.x * 0.5 + 0.5) * characterContainer.clientWidth;
      const y = (0.9 - (cubePosition.y * 0.45)) * characterContainer.clientHeight; // 调整系数

      // 定位气泡（简化计算）
      messageElement.style.position = 'absolute';
      messageElement.style.left = `${x - messageElement.offsetWidth / 2}px`;
      messageElement.style.top = `${y}px`;
    }

    // 初始定位
    updateBubblePosition();

    // 动画时持续更新位置
    function animateWithBubble() {
      requestAnimationFrame(animateWithBubble);
      updateBubblePosition();
    }
    animateWithBubble();

    // 设置消息10秒后自动消失
    setTimeout(() => {
      messageElement.classList.add('fade-out');
      setTimeout(() => {
        messageElement.remove();
      }, 500);
    }, 10000);
  }

  // 接收AI回复
  window.electronAPI.onResponse((event, reply) => {
    addMessage('ai', reply)
  })
})