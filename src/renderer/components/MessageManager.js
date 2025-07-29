/**
 * 消息管理组件
 * 负责消息的显示、存储和管理
 */

export class MessageManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.messages = [];
    this.maxMessages = 100; // 最大消息数量
    this.currentAIMessage = null; // 当前显示的AI消息元素
    this.aiMessageTimeout = null; // AI消息自动消失定时器

    this.initContainer();
  }

  /**
   * 初始化容器
   * @private
   */
  initContainer() {
    if (!this.container) {
      console.error('[MessageManager] Container element not found');
      return;
    }

    this.container.classList.add('message-container');
  }

  /**
   * 添加用户消息（不显示，仅记录）
   * @param {string} text - 消息内容
   * @param {Object} options - 选项
   */
  addUserMessage(text, options = {}) {
    const message = {
      id: this.generateMessageId(),
      type: 'user',
      text: text,
      timestamp: new Date(),
      ...options
    };

    // 仅记录到消息列表，不显示UI
    this.messages.push(message);

    // 限制消息数量
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }

    return message;
  }

  /**
   * 添加AI消息（替换当前显示的AI消息）
   * @param {string} text - 消息内容
   * @param {Object} options - 选项
   */
  addAIMessage(text, options = {}) {
    const message = {
      id: this.generateMessageId(),
      type: 'ai',
      text: text,
      timestamp: new Date(),
      ...options
    };

    // 清除之前的AI消息显示和定时器
    this.clearCurrentAIMessage();

    // 记录到消息列表
    this.messages.push(message);

    // 限制消息数量
    if (this.messages.length > this.maxMessages) {
      const removedMessage = this.messages.shift();
      if (removedMessage.type !== 'ai') {
        this.removeMessageElement(removedMessage.id);
      }
    }

    // 显示新的AI消息
    this.renderAIMessage(message);

    // 设置10秒后自动消失
    this.aiMessageTimeout = setTimeout(() => {
      this.clearCurrentAIMessage();
    }, 10000);

    return message;
  }

  /**
   * 添加系统消息
   * @param {string} text - 消息内容
   * @param {Object} options - 选项
   */
  addSystemMessage(text, options = {}) {
    const message = {
      id: this.generateMessageId(),
      type: 'system',
      text: text,
      timestamp: new Date(),
      ...options
    };

    this.addMessage(message);
    return message;
  }

  /**
   * 添加消息到列表
   * @private
   * @param {Object} message - 消息对象
   */
  addMessage(message) {
    this.messages.push(message);

    // 限制消息数量
    if (this.messages.length > this.maxMessages) {
      const removedMessage = this.messages.shift();
      this.removeMessageElement(removedMessage.id);
    }

    this.renderMessage(message);
    this.scrollToBottom();
  }

  /**
   * 渲染消息
   * @private
   * @param {Object} message - 消息对象
   */
  renderMessage(message) {
    const messageElement = this.createMessageElement(message);
    this.container.appendChild(messageElement);
  }

  /**
   * 创建消息元素
   * @private
   * @param {Object} message - 消息对象
   * @returns {HTMLElement} 消息元素
   */
  createMessageElement(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${message.type}-message`);
    messageElement.setAttribute('data-message-id', message.id);

    // 创建消息内容
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    contentElement.textContent = message.text;

    messageElement.appendChild(contentElement);

    return messageElement;
  }

  /**
   * 移除消息元素
   * @private
   * @param {string} messageId - 消息ID
   */
  removeMessageElement(messageId) {
    const element = this.container.querySelector(`[data-message-id="${messageId}"]`);
    if (element) {
      element.remove();
    }
  }

  /**
   * 清空所有消息
   */
  clearMessages() {
    this.messages = [];
    this.container.innerHTML = '';
  }

  /**
   * 滚动到底部
   * @private
   */
  scrollToBottom() {
    this.container.scrollTop = this.container.scrollHeight;
  }

  /**
   * 清除当前显示的AI消息
   * @private
   */
  clearCurrentAIMessage() {
    // 清除定时器
    if (this.aiMessageTimeout) {
      clearTimeout(this.aiMessageTimeout);
      this.aiMessageTimeout = null;
    }

    // 移除当前AI消息元素
    if (this.currentAIMessage) {
      // 添加淡出动画
      this.currentAIMessage.style.animation = 'fadeOut 0.3s ease-out forwards';

      setTimeout(() => {
        if (this.currentAIMessage && this.currentAIMessage.parentNode) {
          this.currentAIMessage.parentNode.removeChild(this.currentAIMessage);
        }
        this.currentAIMessage = null;
      }, 300);
    }
  }

  /**
   * 渲染AI消息
   * @private
   * @param {Object} message - 消息对象
   */
  renderAIMessage(message) {
    const messageElement = this.createMessageElement(message);
    messageElement.classList.add('ai-message-bubble');

    // 设置为当前AI消息
    this.currentAIMessage = messageElement;

    // 添加到容器
    this.container.appendChild(messageElement);

    // 添加淡入动画
    messageElement.style.animation = 'fadeIn 0.5s ease-out forwards';
  }



  /**
   * 生成消息ID
   * @private
   * @returns {string} 消息ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }



  /**
   * 获取所有消息
   * @returns {Array} 消息列表
   */
  getMessages() {
    return [...this.messages];
  }

  /**
   * 获取最后一条消息
   * @returns {Object|null} 最后一条消息
   */
  getLastMessage() {
    return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
  }

  /**
   * 根据类型获取消息
   * @param {string} type - 消息类型
   * @returns {Array} 指定类型的消息列表
   */
  getMessagesByType(type) {
    return this.messages.filter(message => message.type === type);
  }
}
