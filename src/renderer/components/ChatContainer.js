export class ChatContainer {
  constructor(characterManager) {
    this.characterManager = characterManager;
    this.chatForm = document.getElementById('chat-form');
    this.messageInput = document.getElementById('message-input');
    this.chatMessages = document.getElementById('chat-messages');
    this.toggleButton = document.getElementById('toggle-chat-button');
    this.isChatExpanded = true; // 默认展开状态
    
    this.initEventListeners();
    this.setupCollapsibleChat();
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

  setupCollapsibleChat() {
    // 点击按钮切换聊天框显示状态
    this.toggleButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleChat();
    });
  }

  toggleChat() {
    this.isChatExpanded = !this.isChatExpanded;
    
    if (this.isChatExpanded) {
      // 展开聊天框
      this.chatForm.classList.remove('collapsed');
      this.toggleButton.classList.remove('collapsed');
    } else {
      // 折叠聊天框
      this.chatForm.classList.add('collapsed');
      this.toggleButton.classList.add('collapsed');
    }
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
    
    // 如果聊天框是折叠状态，临时展开显示新消息，然后自动折叠
    if (!this.isChatExpanded) {
      this.toggleChat();
      // 3秒后自动折叠
      setTimeout(() => {
        if (this.isChatExpanded) {
          this.toggleChat();
        }
      }, 3000);
    }
  }
}