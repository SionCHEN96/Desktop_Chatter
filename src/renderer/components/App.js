import { ChatContainer } from './ChatContainer.js';
import { WindowControls } from './WindowControls.js';
import { CharacterManager } from './CharacterManager.js';

export class App {
  constructor() {
    this.characterManager = new CharacterManager();
    this.chatContainer = new ChatContainer(this.characterManager);
    this.windowControls = new WindowControls();

    this.initEventListeners();
    this.checkTTSStatus();
  }

  initEventListeners() {
    // 接收AI响应
    window.electronAPI.onResponse((event, response) => {
      this.handleAIResponse(response);
    });
  }

  handleAIResponse(response) {
    console.log('[App] Received AI response:', response);

    // 检查响应格式（新格式包含text和audioUrl）
    let text, audioUrl;

    if (typeof response === 'object' && response.text) {
      text = response.text;
      audioUrl = response.audioUrl;
      console.log('[App] Parsed response - text:', text?.substring(0, 50) + '...', 'audioUrl:', audioUrl);
    } else {
      // 兼容旧格式（纯文本）
      text = response;
      audioUrl = null;
      console.log('[App] Using legacy format - text:', text?.substring(0, 50) + '...');
    }

    // 显示AI消息（传入音频URL）
    console.log('[App] Calling showAIMessage with audioUrl:', audioUrl);
    this.chatContainer.showAIMessage(text, audioUrl);

    // 播放idle动画
    this.characterManager.playAnimation('idle');

    // 根据响应内容播放不同情绪的动画
    // 这里只是一个示例，实际应用中可以根据响应内容进行判断
    /*
    if (text.includes('高兴') || text.includes('开心')) {
      this.characterManager.playAnimation('joy');
    } else if (text.includes('悲伤') || text.includes('难过')) {
      this.characterManager.playAnimation('sad');
    } else {
      this.characterManager.playAnimation('idle');
    }
    */
  }

  /**
   * 检查TTS服务状态
   */
  async checkTTSStatus() {
    try {
      const ttsStatus = await window.electronAPI.getTTSStatus();
      console.log('[App] TTS Status:', ttsStatus);

      if (ttsStatus.isRunning) {
        console.log('[App] TTS service is running');
        this.chatContainer.showSystemMessage('🎵 语音合成服务已启动');
      } else {
        console.warn('[App] TTS service is not running');
        this.chatContainer.showSystemMessage('⚠️ 语音合成服务未启动，将仅显示文字回复');
      }
    } catch (error) {
      console.error('[App] Failed to check TTS status:', error);
      this.chatContainer.showSystemMessage('❌ 无法检查语音合成服务状态');
    }
  }
}