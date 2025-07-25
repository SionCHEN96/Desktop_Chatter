import { initCharacterContainer, playSimpleAnimation, playAnimation } from './components/characterContainer.js';

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

  // 添加消息气泡动画样式
  const bubbleAnimationStyle = document.createElement('style');
  bubbleAnimationStyle.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(20px); }
    }
    
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0px); }
    }
    
    .message {
      padding: 10px 15px;
      margin: 10px 0;
      border-radius: 20px;
      max-width: 80%;
      word-wrap: break-word;
      animation: fadeIn 0.3s ease-out;
    }
    
    .message.fade-out {
      animation: fadeOut 0.3s ease-out forwards;
    }
    
    .ai-message {
      background-color: rgba(241, 241, 241, 0.8); /* 80%半透明 */
      color: black;
      margin-right: auto;
      animation: float 3s ease-in-out infinite;
    }
  `;
  document.head.appendChild(bubbleAnimationStyle);

  // 处理消息发送
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const message = messageInput.value.trim()
    if (message) {
      // 不再显示用户消息气泡框
      window.electronAPI.sendMessage(message)
      messageInput.value = ''
      
      // 播放简单动画
      playSimpleAnimation();
      
      // 可以根据需要播放特定动画
      // playAnimation('thinking');
    }
  })

  // 显示AI消息的函数
  function showAIMessage(text) {
    // 清空之前的消息
    chatMessages.innerHTML = '';
    
    // 创建新消息元素
    const messageElement = document.createElement('div')
    messageElement.classList.add('message', 'ai-message')
    messageElement.textContent = text
    chatMessages.appendChild(messageElement)
    chatMessages.scrollTop = chatMessages.scrollHeight
    
    // 10秒后自动隐藏消息
    setTimeout(() => {
      messageElement.classList.add('fade-out');
      setTimeout(() => {
        if (messageElement.parentNode) {
          messageElement.parentNode.removeChild(messageElement);
        }
      }, 300); // 与fadeOut动画持续时间匹配
    }, 10000);
  }

  // 接收AI响应
  window.electronAPI.onResponse((event, response) => {
    showAIMessage(response)
    
    // 根据响应内容播放不同情绪的动画
    // 这里只是一个示例，实际应用中可以根据响应内容进行判断
    /*
    if (response.includes('高兴') || response.includes('开心')) {
      playAnimation('joy');
    } else if (response.includes('悲伤') || response.includes('难过')) {
      playAnimation('sad');
    } else {
      playAnimation('idle');
    }
    */
  })
})