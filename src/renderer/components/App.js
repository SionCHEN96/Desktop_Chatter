import { ChatContainer } from './ChatContainer.js';
import { WindowControls } from './WindowControls.js';
import { CharacterManager } from './CharacterManager.js';

export class App {
  constructor() {
    this.characterManager = new CharacterManager();
    this.chatContainer = new ChatContainer(this.characterManager);
    this.windowControls = new WindowControls();
    
    this.initEventListeners();
  }

  initEventListeners() {
    // 接收AI响应
    window.electronAPI.onResponse((event, response) => {
      this.handleAIResponse(response);
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
}