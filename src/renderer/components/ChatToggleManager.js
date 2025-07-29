/**
 * 聊天切换管理组件
 * 负责管理输入框和切换按钮的显示隐藏逻辑
 */

export class ChatToggleManager {
  constructor() {
    this.toggleButton = document.getElementById('toggle-chat-button');
    this.chatForm = document.getElementById('chat-form');
    this.messageInput = document.getElementById('message-input');
    
    this.isInputVisible = false;
    
    this.initEventListeners();
  }

  /**
   * 初始化事件监听器
   * @private
   */
  initEventListeners() {
    // 切换按钮点击事件
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', () => {
        this.showInput();
      });
    }

    // 监听表单提交事件
    if (this.chatForm) {
      this.chatForm.addEventListener('submit', (e) => {
        // 不阻止默认行为，让其他组件处理提交
        // 但在提交后隐藏输入框
        setTimeout(() => {
          this.hideInput();
        }, 100); // 延迟一点确保消息发送完成
      });
    }

    // 监听ESC键隐藏输入框
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isInputVisible) {
        this.hideInput();
      }
    });

    // 点击空白区域隐藏输入框（可选）
    document.addEventListener('click', (e) => {
      if (this.isInputVisible && 
          !this.chatForm.contains(e.target) && 
          !this.toggleButton.contains(e.target)) {
        this.hideInput();
      }
    });
  }

  /**
   * 显示输入框，隐藏切换按钮
   */
  showInput() {
    if (this.isInputVisible) return;

    this.isInputVisible = true;

    // 隐藏切换按钮
    if (this.toggleButton) {
      this.toggleButton.classList.add('collapsed');
    }

    // 显示输入框
    if (this.chatForm) {
      this.chatForm.classList.remove('collapsed');
      
      // 延迟一点聚焦输入框，确保动画完成
      setTimeout(() => {
        if (this.messageInput) {
          this.messageInput.focus();
        }
      }, 300);
    }

    console.log('[ChatToggleManager] Input shown');
  }

  /**
   * 隐藏输入框，显示切换按钮
   */
  hideInput() {
    if (!this.isInputVisible) return;

    this.isInputVisible = false;

    // 隐藏输入框
    if (this.chatForm) {
      this.chatForm.classList.add('collapsed');
    }

    // 显示切换按钮
    if (this.toggleButton) {
      this.toggleButton.classList.remove('collapsed');
    }

    // 清空输入框内容
    if (this.messageInput) {
      this.messageInput.value = '';
      this.messageInput.blur(); // 失去焦点
    }

    console.log('[ChatToggleManager] Input hidden');
  }

  /**
   * 获取输入框显示状态
   * @returns {boolean} 是否显示
   */
  isInputShown() {
    return this.isInputVisible;
  }

  /**
   * 切换输入框显示状态
   */
  toggleInput() {
    if (this.isInputVisible) {
      this.hideInput();
    } else {
      this.showInput();
    }
  }

  /**
   * 强制隐藏输入框（用于消息发送后）
   */
  forceHideInput() {
    this.hideInput();
  }

  /**
   * 设置输入框占位符文本
   * @param {string} placeholder - 占位符文本
   */
  setPlaceholder(placeholder) {
    if (this.messageInput) {
      this.messageInput.placeholder = placeholder;
    }
  }

  /**
   * 获取输入框的值
   * @returns {string} 输入框内容
   */
  getInputValue() {
    return this.messageInput ? this.messageInput.value.trim() : '';
  }

  /**
   * 清空输入框
   */
  clearInput() {
    if (this.messageInput) {
      this.messageInput.value = '';
    }
  }
}
