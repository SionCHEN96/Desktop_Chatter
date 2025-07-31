/**
 * 创建可爱的托盘图标
 * 使用Canvas API创建一个可爱的AI助手图标
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 创建可爱的PNG图标
 */
function createCutePNGIcon() {
  const size = 32; // 32x32像素，更高质量
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
      if (distance <= 14 && distance >= 12) {
        buffer[index] = 255;     // R
        buffer[index + 1] = 105; // G
        buffer[index + 2] = 180; // B
        buffer[index + 3] = 255; // A
      }
      
      // 主体圆形 (浅粉色)
      if (distance <= 12) {
        buffer[index] = 255;     // R
        buffer[index + 1] = 192; // G
        buffer[index + 2] = 203; // B
        buffer[index + 3] = 255; // A
      }
      
      // 内部脸部 (更浅的粉色)
      if (distance <= 10) {
        buffer[index] = 255;     // R
        buffer[index + 1] = 220; // G
        buffer[index + 2] = 225; // B
        buffer[index + 3] = 255; // A
      }
      
      // 左眼
      if (Math.sqrt((x - 12) ** 2 + (y - 12) ** 2) <= 1.5) {
        buffer[index] = 0;       // R - 黑色
        buffer[index + 1] = 0;   // G
        buffer[index + 2] = 0;   // B
        buffer[index + 3] = 255; // A
      }
      
      // 右眼
      if (Math.sqrt((x - 20) ** 2 + (y - 12) ** 2) <= 1.5) {
        buffer[index] = 0;       // R - 黑色
        buffer[index + 1] = 0;   // G
        buffer[index + 2] = 0;   // B
        buffer[index + 3] = 255; // A
      }
      
      // 左眼高光
      if (Math.sqrt((x - 12.5) ** 2 + (y - 11.5) ** 2) <= 0.5) {
        buffer[index] = 255;     // R - 白色
        buffer[index + 1] = 255; // G
        buffer[index + 2] = 255; // B
        buffer[index + 3] = 255; // A
      }
      
      // 右眼高光
      if (Math.sqrt((x - 20.5) ** 2 + (y - 11.5) ** 2) <= 0.5) {
        buffer[index] = 255;     // R - 白色
        buffer[index + 1] = 255; // G
        buffer[index + 2] = 255; // B
        buffer[index + 3] = 255; // A
      }
      
      // 嘴巴 (微笑弧线的几个点)
      if ((x >= 14 && x <= 18 && y === 20) || 
          (x === 13 && y === 19) || (x === 19 && y === 19) ||
          (x === 15 && y === 21) || (x === 17 && y === 21)) {
        buffer[index] = 255;     // R - 深粉色
        buffer[index + 1] = 105; // G
        buffer[index + 2] = 180; // B
        buffer[index + 3] = 255; // A
      }
      
      // 左腮红
      if (Math.sqrt((x - 8) ** 2 + (y - 17) ** 2) <= 2) {
        buffer[index] = 255;     // R - 腮红粉色
        buffer[index + 1] = 182; // G
        buffer[index + 2] = 193; // B
        buffer[index + 3] = 150; // A (半透明)
      }
      
      // 右腮红
      if (Math.sqrt((x - 24) ** 2 + (y - 17) ** 2) <= 2) {
        buffer[index] = 255;     // R - 腮红粉色
        buffer[index + 1] = 182; // G
        buffer[index + 2] = 193; // B
        buffer[index + 3] = 150; // A (半透明)
      }
      
      // 头顶天线
      if (x === 16 && y >= 2 && y <= 6) {
        buffer[index] = 255;     // R - 金色
        buffer[index + 1] = 215; // G
        buffer[index + 2] = 0;   // B
        buffer[index + 3] = 255; // A
      }
      
      // 天线顶部小球
      if (Math.sqrt((x - 16) ** 2 + (y - 2) ** 2) <= 1) {
        buffer[index] = 255;     // R - 金色
        buffer[index + 1] = 215; // G
        buffer[index + 2] = 0;   // B
        buffer[index + 3] = 255; // A
      }
      
      // 装饰小星星 (右上角)
      if ((x === 26 && y === 6) || 
          (x === 25 && y === 7) || (x === 27 && y === 7) ||
          (x === 26 && y === 8)) {
        buffer[index] = 255;     // R - 金色
        buffer[index + 1] = 215; // G
        buffer[index + 2] = 0;   // B
        buffer[index + 3] = 200; // A (半透明)
      }
      
      // 装饰小星星 (左上角)
      if ((x === 6 && y === 8) || 
          (x === 5 && y === 9) || (x === 7 && y === 9)) {
        buffer[index] = 255;     // R - 金色
        buffer[index + 1] = 215; // G
        buffer[index + 2] = 0;   // B
        buffer[index + 3] = 150; // A (半透明)
      }
    }
  }
  
  return buffer;
}

// 创建图标文件
try {
  const iconBuffer = createCutePNGIcon();
  const iconPath = path.join(__dirname, 'tray-icon.png');
  
  // 创建简单的PNG文件头
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // 这里我们直接保存原始RGBA数据，让Electron的nativeImage处理
  fs.writeFileSync(iconPath + '.raw', iconBuffer);
  
  console.log('可爱的托盘图标数据已创建:', iconPath + '.raw');
  console.log('图标将由应用程序动态生成');
} catch (error) {
  console.error('创建图标失败:', error);
}
