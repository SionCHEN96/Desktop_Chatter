export class ChatContainer {
  constructor(characterManager) {
    this.characterManager = characterManager;
    this.chatForm = document.getElementById('chat-form');
    this.messageInput = document.getElementById('message-input');
    this.chatMessages = document.getElementById('chat-messages');
    
    this.initEventListeners();
  }

  initEventListeners() {
    // 处理消息发送
    this.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const message = this.messageInput.value.trim();
      if (message) {
        this.sendMessage(message);
      }
    });
  }

  sendMessage(message) {
    window.electronAPI.sendMessage(message);
    this.messageInput.value = '';
    
    // 播放思考动画
    if (this.characterManager) {
      this.characterManager.playAnimation('thinking');
    }
  }

  showAIMessage(text) {
    // 清空之前的消息
    this.chatMessages.innerHTML = '';

    // 创建新消息元素
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'ai-message');
    messageElement.textContent = text;
    this.chatMessages.appendChild(messageElement);

    // 自动滚动到底部
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }
}