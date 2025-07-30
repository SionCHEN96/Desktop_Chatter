/**
 * 输入管理组件
 * 负责用户输入的处理和验证
 */

export class InputManager {
  constructor(formElement, inputElement, options = {}) {
    this.form = formElement;
    this.input = inputElement;
    this.options = {
      maxLength: 1000,
      placeholder: '和我聊聊吧~ ✨',
      enableHistory: true,
      historySize: 20,
      ...options
    };
    
    this.inputHistory = [];
    this.historyIndex = -1;
    this.isProcessing = false;
    
    this.initInput();
    this.initEventListeners();
  }

  /**
   * 初始化输入框
   * @private
   */
  initInput() {
    if (!this.input) {
      console.error('[InputManager] Input element not found');
      return;
    }
    
    this.input.setAttribute('maxlength', this.options.maxLength);
    this.input.setAttribute('placeholder', this.options.placeholder);
    this.input.classList.add('message-input');
  }

  /**
   * 初始化事件监听器
   * @private
   */
  initEventListeners() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    
    if (this.input) {
      this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
      this.input.addEventListener('input', (e) => this.handleInput(e));
      this.input.addEventListener('paste', (e) => this.handlePaste(e));
    }
  }

  /**
   * 处理表单提交
   * @private
   * @param {Event} event - 提交事件
   */
  handleSubmit(event) {
    event.preventDefault();
    
    if (this.isProcessing) {
      return;
    }
    
    const message = this.getValue().trim();
    if (message) {
      this.onMessageSend(message);
    }
  }

  /**
   * 处理键盘事件
   * @private
   * @param {KeyboardEvent} event - 键盘事件
   */
  handleKeyDown(event) {
    switch (event.key) {
      case 'Enter':
        if (!event.shiftKey) {
          event.preventDefault();
          this.handleSubmit(event);
        }
        break;
      case 'ArrowUp':
        if (this.options.enableHistory) {
          event.preventDefault();
          this.navigateHistory('up');
        }
        break;
      case 'ArrowDown':
        if (this.options.enableHistory) {
          event.preventDefault();
          this.navigateHistory('down');
        }
        break;
      case 'Escape':
        this.clearInput();
        break;
    }
  }

  /**
   * 处理输入事件
   * @private
   * @param {InputEvent} event - 输入事件
   */
  handleInput(event) {
    const value = event.target.value;
    
    // 验证输入长度
    if (value.length > this.options.maxLength) {
      event.target.value = value.substring(0, this.options.maxLength);
    }
    
    // 触发输入变化回调
    if (this.onInputChange) {
      this.onInputChange(event.target.value);
    }
  }

  /**
   * 处理粘贴事件
   * @private
   * @param {ClipboardEvent} event - 粘贴事件
   */
  handlePaste(event) {
    const pastedText = event.clipboardData.getData('text');
    const currentValue = this.input.value;
    const newValue = currentValue + pastedText;
    
    if (newValue.length > this.options.maxLength) {
      event.preventDefault();
      const allowedLength = this.options.maxLength - currentValue.length;
      const truncatedText = pastedText.substring(0, allowedLength);
      
      // 手动插入截断的文本
      const start = this.input.selectionStart;
      const end = this.input.selectionEnd;
      this.input.value = currentValue.substring(0, start) + truncatedText + currentValue.substring(end);
      this.input.setSelectionRange(start + truncatedText.length, start + truncatedText.length);
    }
  }

  /**
   * 导航历史记录
   * @private
   * @param {string} direction - 方向 ('up' 或 'down')
   */
  navigateHistory(direction) {
    if (this.inputHistory.length === 0) return;
    
    if (direction === 'up') {
      if (this.historyIndex < this.inputHistory.length - 1) {
        this.historyIndex++;
        this.setValue(this.inputHistory[this.inputHistory.length - 1 - this.historyIndex]);
      }
    } else if (direction === 'down') {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.setValue(this.inputHistory[this.inputHistory.length - 1 - this.historyIndex]);
      } else if (this.historyIndex === 0) {
        this.historyIndex = -1;
        this.clearInput();
      }
    }
  }

  /**
   * 添加到历史记录
   * @private
   * @param {string} message - 消息内容
   */
  addToHistory(message) {
    if (!this.options.enableHistory || !message.trim()) return;
    
    // 避免重复的历史记录
    const lastMessage = this.inputHistory[this.inputHistory.length - 1];
    if (lastMessage === message) return;
    
    this.inputHistory.push(message);
    
    // 限制历史记录大小
    if (this.inputHistory.length > this.options.historySize) {
      this.inputHistory.shift();
    }
    
    this.historyIndex = -1;
  }

  /**
   * 发送消息
   * @param {string} message - 消息内容
   */
  sendMessage(message) {
    if (this.isProcessing) return;
    
    this.setProcessing(true);
    this.addToHistory(message);
    this.clearInput();
    
    if (this.onMessageSend) {
      this.onMessageSend(message);
    }
  }

  /**
   * 设置处理状态
   * @param {boolean} processing - 是否正在处理
   */
  setProcessing(processing) {
    this.isProcessing = processing;
    
    if (this.input) {
      this.input.disabled = processing;
      this.input.placeholder = processing ? '正在处理中...' : this.options.placeholder;
    }
  }

  /**
   * 获取输入值
   * @returns {string} 输入值
   */
  getValue() {
    return this.input ? this.input.value : '';
  }

  /**
   * 设置输入值
   * @param {string} value - 输入值
   */
  setValue(value) {
    if (this.input) {
      this.input.value = value;
      this.input.focus();
      this.input.setSelectionRange(value.length, value.length);
    }
  }

  /**
   * 清空输入
   */
  clearInput() {
    this.setValue('');
  }

  /**
   * 聚焦输入框
   */
  focus() {
    if (this.input && !this.isProcessing) {
      this.input.focus();
    }
  }

  /**
   * 设置消息发送回调
   * @param {Function} callback - 回调函数
   */
  onMessageSend(callback) {
    this.onMessageSend = callback;
  }

  /**
   * 设置输入变化回调
   * @param {Function} callback - 回调函数
   */
  onInputChange(callback) {
    this.onInputChange = callback;
  }
}
