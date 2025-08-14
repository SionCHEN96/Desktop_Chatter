/**
 * 系统托盘服务
 * 负责管理系统托盘图标和菜单
 */

import { Tray, Menu, app, nativeImage } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前模块的目录名
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 托盘服务类
 * 封装系统托盘相关的所有操作
 */
export class TrayService {
  constructor(windowService, cleanupService = null) {
    this.tray = null;
    this.windowService = windowService;
    this.cleanupService = cleanupService;
  }

  /**
   * 创建系统托盘
   */
  createTray() {
    try {
      // 直接使用可爱的默认图标
      console.log('[TrayService] Creating tray icon...');
      const trayIcon = this.createDefaultIcon();

      this.tray = new Tray(trayIcon);

      // Set tray tooltip text
      this.tray.setToolTip('AI Companion');

      // Create context menu
      this.createContextMenu();

      // Add double-click event handler
      this.tray.on('double-click', () => {
        this.handleDoubleClick();
      });

      console.log('[TrayService] System tray created successfully');
    } catch (error) {
      console.error('[TrayService] 创建系统托盘失败:', error);
    }
  }

  /**
   * 创建可爱的默认图标
   * @returns {nativeImage} 可爱的默认图标
   */
  createDefaultIcon() {
    // 创建一个16x16像素的可爱图标（适合系统托盘）
    const size = 16;
    const buffer = Buffer.alloc(size * size * 4); // RGBA

    // 创建一个可爱的AI助手图标
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const index = (y * size + x) * 4;
        const centerX = size / 2;
        const centerY = size / 2;
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 默认透明背景
        buffer[index] = 0;     // R
        buffer[index + 1] = 0; // G
        buffer[index + 2] = 0; // B
        buffer[index + 3] = 0; // A (透明)

        // 外圈边框 (深粉色)
        if (distance <= 7 && distance >= 6) {
          buffer[index] = 255;     // R
          buffer[index + 1] = 105; // G
          buffer[index + 2] = 180; // B
          buffer[index + 3] = 255; // A
        }

        // 主体圆形 (浅粉色)
        if (distance <= 6) {
          buffer[index] = 255;     // R
          buffer[index + 1] = 192; // G
          buffer[index + 2] = 203; // B
          buffer[index + 3] = 255; // A
        }

        // 内部脸部 (更浅的粉色)
        if (distance <= 5) {
          buffer[index] = 255;     // R
          buffer[index + 1] = 220; // G
          buffer[index + 2] = 225; // B
          buffer[index + 3] = 255; // A
        }
      }
    }

    // 添加面部特征
    this.addFacialFeatures(buffer, size);

    return nativeImage.createFromBuffer(buffer, { width: size, height: size });
  }

  /**
   * 添加面部特征到图标缓冲区
   * @param {Buffer} buffer - 图像缓冲区
   * @param {number} size - 图像尺寸
   */
  addFacialFeatures(buffer, size) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const index = (y * size + x) * 4;

        // 左眼
        if ((x === 5 && y === 6) || (x === 6 && y === 6)) {
          buffer[index] = 0;       // R - 黑色
          buffer[index + 1] = 0;   // G
          buffer[index + 2] = 0;   // B
          buffer[index + 3] = 255; // A
        }

        // 右眼
        if ((x === 10 && y === 6) || (x === 11 && y === 6)) {
          buffer[index] = 0;       // R - 黑色
          buffer[index + 1] = 0;   // G
          buffer[index + 2] = 0;   // B
          buffer[index + 3] = 255; // A
        }

        // 左眼高光
        if (x === 6 && y === 5) {
          buffer[index] = 255;     // R - 白色
          buffer[index + 1] = 255; // G
          buffer[index + 2] = 255; // B
          buffer[index + 3] = 255; // A
        }

        // 右眼高光
        if (x === 11 && y === 5) {
          buffer[index] = 255;     // R - 白色
          buffer[index + 1] = 255; // G
          buffer[index + 2] = 255; // B
          buffer[index + 3] = 255; // A
        }

        // 嘴巴 (微笑弧线)
        if ((x === 7 && y === 10) || (x === 8 && y === 11) || (x === 9 && y === 10)) {
          buffer[index] = 255;     // R - 深粉色
          buffer[index + 1] = 105; // G
          buffer[index + 2] = 180; // B
          buffer[index + 3] = 255; // A
        }

        // 左腮红
        if ((x === 3 && y === 9) || (x === 4 && y === 8)) {
          buffer[index] = 255;     // R - 腮红粉色
          buffer[index + 1] = 182; // G
          buffer[index + 2] = 193; // B
          buffer[index + 3] = 150; // A (半透明)
        }

        // 右腮红
        if ((x === 12 && y === 8) || (x === 13 && y === 9)) {
          buffer[index] = 255;     // R - 腮红粉色
          buffer[index + 1] = 182; // G
          buffer[index + 2] = 193; // B
          buffer[index + 3] = 150; // A (半透明)
        }

        // 头顶天线
        if (x === 8 && y >= 1 && y <= 3) {
          buffer[index] = 255;     // R - 金色
          buffer[index + 1] = 215; // G
          buffer[index + 2] = 0;   // B
          buffer[index + 3] = 255; // A
        }

        // 天线顶部小球
        if (x === 8 && y === 1) {
          buffer[index] = 255;     // R - 金色
          buffer[index + 1] = 215; // G
          buffer[index + 2] = 0;   // B
          buffer[index + 3] = 255; // A
        }

        // 装饰小星星 (右上角)
        if (x === 13 && y === 3) {
          buffer[index] = 255;     // R - 金色
          buffer[index + 1] = 215; // G
          buffer[index + 2] = 0;   // B
          buffer[index + 3] = 200; // A (半透明)
        }

        // 装饰小星星 (左上角)
        if (x === 3 && y === 4) {
          buffer[index] = 255;     // R - 金色
          buffer[index + 1] = 215; // G
          buffer[index + 2] = 0;   // B
          buffer[index + 3] = 150; // A (半透明)
        }
      }
    }
  }

  /**
   * 创建右键菜单
   */
  createContextMenu() {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Settings',
        click: () => {
          this.handleSettingsClick();
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        click: () => {
          this.handleQuitClick();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  /**
   * Handle tray icon double-click
   */
  handleDoubleClick() {
    console.log('[TrayService] Tray icon double-clicked - bringing window to front');
    const mainWindow = this.windowService.getMainWindow();

    if (mainWindow) {
      // If window is minimized, restore it first
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }

      // Show window
      mainWindow.show();

      // Bring window to front
      mainWindow.focus();
      mainWindow.moveTop();

      console.log('[TrayService] Window brought to front');
    } else {
      console.error('[TrayService] Main window does not exist');
    }
  }

  /**
   * Handle settings button click
   */
  handleSettingsClick() {
    console.log('[TrayService] Settings clicked - no action for now');
    // No action for now, as per requirements
  }

  /**
   * Handle quit button click
   */
  async handleQuitClick() {
    console.log('[TrayService] Quit clicked - starting safe application exit');

    try {
      // If cleanup service is available, perform quick cleanup first
      if (this.cleanupService) {
        console.log('[TrayService] Performing cleanup before quit...');
        await this.cleanupService.quickCleanup();
      }

      // Exit application
      app.quit();
    } catch (error) {
      console.error('[TrayService] Error during quit cleanup:', error);
      // Exit application even if cleanup fails
      app.quit();
    }
  }

  /**
   * Destroy tray
   */
  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
      console.log('[TrayService] System tray destroyed');
    }
  }

  /**
   * Get tray instance
   * @returns {Tray|null} Tray instance
   */
  getTray() {
    return this.tray;
  }
}