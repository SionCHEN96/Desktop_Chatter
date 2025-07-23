import * as THREE from 'three';
import { initCharacterContainer, characterContainer, scene, camera } from './character-container.js';

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
      max-height: 300px;
      overflow-y: auto;
      word-wrap: break-word;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      font-size: 14px;
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
    if (!camera || !characterContainer) {
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

    // 固定气泡在character上方
    function updateBubblePosition() {
      // 固定位置，不再随立方体旋转而变化
      const containerRect = characterContainer.getBoundingClientRect();
      const centerX = containerRect.width / 2;
      
      // 固定在character容器的上部位置，上移20px
      const fixedY = -20; // 负值表示向上移动
      
      // 定位气泡
      messageElement.style.position = 'absolute';
      messageElement.style.left = `${centerX - messageElement.offsetWidth / 2}px`;
      messageElement.style.bottom = `${containerRect.height - fixedY}px`; // 固定底部位置
      messageElement.style.top = 'auto'; // 取消top定位，使用bottom定位
    }

    // 初始定位
    updateBubblePosition();
    
    // 不再需要动画更新气泡位置，因为位置已固定

    // 设置消息10秒后自动消失
    setTimeout(() => {
      messageElement.classList.add('fade-out');
      setTimeout(() => {
        messageElement.remove();
      }, 600); // 增加到600ms以匹配动画时长
    }, 10000);
  }

  // 接收AI回复
  window.electronAPI.onResponse((event, reply) => {
    addMessage('ai', reply)
  })
})