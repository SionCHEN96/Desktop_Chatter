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
      padding: 15px 20px;
      margin: 10px 0;
      border-radius: 20px;
      max-width: 80%;
      word-wrap: break-word;
      animation: fadeIn 0.3s ease-out;
      line-height: 1.4;
      max-height: 300px;
      overflow-y: auto;
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
      
      // 播放思考动画
      console.log('准备播放思考动画');
      playAnimation('thinking');
      console.log('已调用播放思考动画');
    }
  })

  // 显示AI消息的函数
  function showAIMessage(text) {
    console.log('准备显示AI消息并切换到idle动画');
    
    // 清空之前的消息
    chatMessages.innerHTML = '';

    // 创建新消息元素
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'ai-message');
    messageElement.textContent = text;
    chatMessages.appendChild(messageElement);

    // 自动滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // 当AI回复出现时，取消thinking动画并恢复idle动画
    console.log('准备播放idle动画');
    playAnimation('idle');
    console.log('已调用播放idle动画');
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