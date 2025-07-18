document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chat-form')
  const messageInput = document.getElementById('message-input')
  const chatMessages = document.getElementById('chat-messages')

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
    const messageElement = document.createElement('div')
    messageElement.className = `message ${sender}`
    messageElement.textContent = text
    chatMessages.appendChild(messageElement)
    chatMessages.scrollTop = chatMessages.scrollHeight
  }

  // 接收AI回复
  window.electronAPI.onReply((reply) => {
    addMessage('ai', reply)
  })
})