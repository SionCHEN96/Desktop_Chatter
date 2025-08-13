/**
 * 窗口管理服务
 * 负责应用窗口的创建、管理和配置
 */

import { BrowserWindow, screen } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import remoteMain from '@electron/remote/main/index.js';
import { WINDOW_CONFIG } from '../../config/index.js';

// 获取当前模块的目录名
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 窗口服务类
 * 封装窗口相关的所有操作
 */
export class WindowService {
  constructor() {
    this.mainWindow = null;
  }

  /**
   * 创建主窗口
   * @returns {BrowserWindow} 创建的窗口实例
   */
  createMainWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    this.mainWindow = new BrowserWindow({
      width: WINDOW_CONFIG.width,
      height: WINDOW_CONFIG.height,
      transparent: WINDOW_CONFIG.transparent,
      frame: WINDOW_CONFIG.frame,
      show: WINDOW_CONFIG.show !== false,  // 使用配置中的show属性
      skipTaskbar: WINDOW_CONFIG.skipTaskbar || false,  // 不在任务栏显示
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false, // 允许加载本地资源
        preload: join(__dirname, '../../preload.js')
      }
    });

    // 加载HTML文件
    this.mainWindow.loadFile(join(__dirname, '../../../index.html'));

    // 初始化@electron/remote模块
    remoteMain.enable(this.mainWindow.webContents);

    // 开发环境下启用开发者工具
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools();
    }

    return this.mainWindow;
  }

  /**
   * 获取主窗口实例
   * @returns {BrowserWindow|null} 主窗口实例
   */
  getMainWindow() {
    return this.mainWindow;
  }

  /**
   * 关闭主窗口
   */
  closeMainWindow() {
    if (this.mainWindow) {
      this.mainWindow.close();
      this.mainWindow = null;
    }
  }

  /**
   * 最小化主窗口
   */
  minimizeMainWindow() {
    if (this.mainWindow) {
      this.mainWindow.minimize();
    }
  }

  /**
   * 最大化/还原主窗口
   */
  toggleMaximizeMainWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow.maximize();
      }
    }
  }

  /**
   * 设置窗口置顶状态
   * @param {boolean} alwaysOnTop - 是否置顶
   */
  setAlwaysOnTop(alwaysOnTop) {
    if (this.mainWindow) {
      this.mainWindow.setAlwaysOnTop(alwaysOnTop);
    }
  }

  /**
   * 设置窗口可见性
   * @param {boolean} visible - 是否可见
   */
  setWindowVisibility(visible) {
    if (this.mainWindow) {
      if (visible) {
        this.mainWindow.show();
      } else {
        this.mainWindow.hide();
      }
    }
  }

  /**
   * 移动窗口位置
   * @param {number} deltaX - X轴移动距离
   * @param {number} deltaY - Y轴移动距离
   */
  moveWindow(deltaX, deltaY) {
    console.log('[WindowService] 移动窗口', { deltaX, deltaY });
    if (this.mainWindow) {
      const [currentX, currentY] = this.mainWindow.getPosition();
      const newX = currentX + deltaX;
      const newY = currentY + deltaY;
      console.log('[WindowService] 窗口位置变化', {
        from: [currentX, currentY],
        to: [newX, newY]
      });
      this.mainWindow.setPosition(newX, newY);
    } else {
      console.error('[WindowService] mainWindow 不存在');
    }
  }

}
