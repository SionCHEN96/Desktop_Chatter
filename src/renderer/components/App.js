import { ChatContainer } from './ChatContainer.js';
import { WindowControls } from './WindowControls.js';
import { CharacterManager } from './CharacterManager.js';

export class App {
  constructor() {
    this.characterManager = new CharacterManager();
    this.chatContainer = new ChatContainer(this.characterManager);
    this.windowControls = new WindowControls();
    this.currentAudio = null; // 当前播放的音频元素

    this.initEventListeners();
  }

  initEventListeners() {
    // 接收AI响应
    window.electronAPI.onResponse((event, response) => {
      this.handleAIResponse(response);
    });

    // 接收生成的音频
    window.electronAPI.onAudioGenerated((event, audioPath) => {
      this.handleAudioGenerated(audioPath);
    });
  }

  handleAIResponse(response) {
    // 显示AI消息
    this.chatContainer.showAIMessage(response);

    // 播放idle动画
    this.characterManager.playAnimation('idle');

    // 根据响应内容播放不同情绪的动画
    // 这里只是一个示例，实际应用中可以根据响应内容进行判断
    /*
    if (response.includes('高兴') || response.includes('开心')) {
      this.characterManager.playAnimation('joy');
    } else if (response.includes('悲伤') || response.includes('难过')) {
      this.characterManager.playAnimation('sad');
    } else {
      this.characterManager.playAnimation('idle');
    }
    */
  }

  /**
   * 处理生成的音频
   * @param {string} audioPath - 音频文件路径
   */
  async handleAudioGenerated(audioPath) {
    try {
      console.log('[App] Audio generated:', audioPath);

      // 使用IPC API获取正确的音频文件路径
      const fullAudioPath = await window.electronAPI.getAudioFilePath(audioPath);

      if (fullAudioPath) {
        console.log('[App] Resolved audio path:', fullAudioPath);

        this.playAudio(fullAudioPath)
          .then(() => {
            console.log('[App] Xiangling voice playback completed');
          })
          .catch(error => {
            console.error('[App] Failed to play Xiangling voice:', error);
          });
      } else {
        console.error('[App] Failed to resolve audio file path:', audioPath);
      }

    } catch (error) {
      console.error('[App] Error handling generated audio:', error);
    }
  }



  /**
   * 播放音频文件
   * @param {string} audioPath - 音频文件路径
   * @returns {Promise<void>}
   */
  async playAudio(audioPath) {
    return new Promise((resolve, reject) => {
      try {
        // 停止当前播放的音频
        if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
        }

        // 创建新的音频元素
        this.currentAudio = new Audio(audioPath);
        this.currentAudio.volume = 0.8;

        // 添加事件监听器
        this.currentAudio.addEventListener('ended', () => {
          console.log('[App] Audio playback ended');
          resolve();
        });

        this.currentAudio.addEventListener('error', (error) => {
          console.error('[App] Audio playback error:', error);
          reject(error);
        });

        // 播放音频
        this.currentAudio.play()
          .then(() => {
            console.log('[App] Audio playback started:', audioPath);
          })
          .catch(reject);

      } catch (error) {
        reject(error);
      }
    });
  }
}