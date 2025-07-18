document.addEventListener('DOMContentLoaded', () => {
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

  // 添加消息到聊天界面
  function addMessage(sender, text) {
    if (sender === 'user') {
      // 用户消息不显示，但保留发送功能
      return;
    }

    // 清除之前的AI消息
    const aiMessages = chatMessages.querySelectorAll('.message.ai');
    aiMessages.forEach(msg => msg.remove());

    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    messageElement.textContent = text;
    chatMessages.appendChild(messageElement);

    // 设置消息10秒后自动消失
    setTimeout(() => {
      messageElement.classList.add('fade-out');
      setTimeout(() => {
        messageElement.remove();
      }, 500);
    }, 10000);
  }

  // 接收AI回复
  window.electronAPI.onReply((reply) => {
    addMessage('ai', reply)
  })
})