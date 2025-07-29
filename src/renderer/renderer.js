import { initCharacterContainer, playSimpleAnimation, playAnimation } from '../core/character/index.js';

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
      // 不再显示用户消息气泡框
      window.electronAPI.sendMessage(message)
      messageInput.value = ''

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