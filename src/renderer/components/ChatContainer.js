export class ChatContainer {
  constructor(characterManager) {
    this.characterManager = characterManager;
    this.chatForm = document.getElementById('chat-form');
    this.messageInput = document.getElementById('message-input');
    this.chatMessages = document.getElementById('chat-messages');
    this.toggleButton = document.getElementById('toggle-chat-button');
    this.isChatExpanded = false; // 默认隐藏状态
    
    // 初始化时隐藏聊天表单
    this.chatForm.classList.add('collapsed');
    
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
        // 发送消息后隐藏聊天表单，显示按钮
        this.hideChat();
      }
    });
  }

  setupCollapsibleChat() {
    // 点击按钮切换聊天框显示状态
    this.toggleButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showChat();
    });
  }

  showChat() {
    this.isChatExpanded = true;
    this.chatForm.classList.remove('collapsed');
    this.toggleButton.classList.add('collapsed');
    
    // 显示聊天框后自动聚焦到输入框
    setTimeout(() => {
      this.messageInput.focus();
    }, 300); // 等待动画完成后再聚焦
  }

  hideChat() {
    this.isChatExpanded = false;
    this.chatForm.classList.add('collapsed');
    this.toggleButton.classList.remove('collapsed');
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
    
    // 显示消息3秒后自动隐藏
    setTimeout(() => {
      // 可以在这里添加消息自动隐藏的逻辑
    }, 3000);
  }
}