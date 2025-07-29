export class WindowControls {
  constructor() {
    this.closeButton = document.getElementById('close-button');
    this.initEventListeners();
  }

  initEventListeners() {
    // 添加关闭按钮事件监听
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => {
        window.electronAPI.closeWindow();
      });
    }
  }
}