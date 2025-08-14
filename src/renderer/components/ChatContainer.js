/**
 * 聊天容器组件
 * 整合消息管理和输入管理，提供完整的聊天功能
 */

import { MessageManager } from './MessageManager.js';
import { InputManager } from './InputManager.js';
import { ChatToggleManager } from './ChatToggleManager.js';

export class ChatContainer {
  constructor(characterManager) {
    this.characterManager = characterManager;

    // 获取DOM元素
    this.chatForm = document.getElementById('chat-form');
    this.messageInput = document.getElementById('message-input');
    this.chatMessages = document.getElementById('chat-messages');

    // 初始化管理器
    this.messageManager = new MessageManager(this.chatMessages);
    this.inputManager = new InputManager(this.chatForm, this.messageInput);
    this.toggleManager = new ChatToggleManager();

    this.initEventListeners();
  }

  /**
   * 初始化事件监听器
   * @private
   */
  initEventListeners() {
    // 设置输入管理器的消息发送回调
    this.inputManager.onMessageSend = (message) => {
      this.sendMessage(message);
    };

    // 设置输入变化回调
    this.inputManager.onInputChange = (value) => {
      this.onInputChange(value);
    };
  }

  /**
   * 发送消息
   * @param {string} message - 消息内容
   */
  sendMessage(message) {
    // 显示用户消息
    this.messageManager.addUserMessage(message);

    // 发送到主进程
    window.electronAPI.sendMessage(message);

    // 播放思考动画
    if (this.characterManager) {
      this.characterManager.playAnimation('thinking');
    }

    // 设置输入为处理状态
    this.inputManager.setProcessing(true);

    // 发送消息后隐藏输入框
    this.toggleManager.forceHideInput();
  }

  /**
   * 显示AI消息
   * @param {string} text - AI响应内容
   * @param {string|null} audioUrl - 音频文件URL
   */
  showAIMessage(text, audioUrl = null) {
    // Check text length to decide whether to use segmented TTS
    const shouldUseSegmentedTTS = !audioUrl && text.length > 50;

    if (shouldUseSegmentedTTS) {
      console.log('[ChatContainer] Using segmented TTS for long text:', text.length, 'characters');
      // Use segmented speech synthesis
      this.messageManager.addAIMessage(text, {
        enableSegmentedTTS: true
      });
    } else {
      // Use traditional method (existing audio URL or short text)
      this.messageManager.addAIMessage(text, { audioUrl });
    }

    // 恢复输入状态
    this.inputManager.setProcessing(false);
    this.inputManager.focus();
  }

  /**
   * 显示系统消息
   * @param {string} text - 系统消息内容
   */
  showSystemMessage(text) {
    this.messageManager.addSystemMessage(text);
  }

  /**
   * 清空聊天记录
   */
  clearChat() {
    this.messageManager.clearMessages();
    this.inputManager.clearInput();
    this.inputManager.focus();
  }

  /**
   * 输入变化处理
   * @private
   * @param {string} value - 输入值
   */
  onInputChange(value) {
    // 可以在这里添加输入提示、自动完成等功能
    console.log('[ChatContainer] Input changed:', value.length);
  }

  /**
   * 获取聊天历史
   * @returns {Array} 消息列表
   */
  getChatHistory() {
    return this.messageManager.getMessages();
  }

  /**
   * 设置输入焦点
   */
  focusInput() {
    this.inputManager.focus();
  }
}