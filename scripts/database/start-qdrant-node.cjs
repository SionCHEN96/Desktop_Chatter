#!/usr/bin/env node

// 启动脚本：最终版本的 Electron 应用启动器

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 获取当前工作目录
const currentWorkingDir = process.cwd();

// 定义 Qdrant 数据目录路径
const qdrantDataDir = path.join(currentWorkingDir, 'qdrant_data');

// 确保 Qdrant 数据目录存在
if (!fs.existsSync(qdrantDataDir)) {
  fs.mkdirSync(qdrantDataDir, { recursive: true });
  console.log(`[初始化] 创建 Qdrant 数据目录: ${qdrantDataDir}`);
}

console.log('[启动] 正在启动 Electron 应用 (使用降级存储方案)...');

// 启动 Electron 应用
const electronProcess = spawn('electron', ['.'], { 
  shell: true,
  stdio: 'inherit'
});

// 处理 Electron 进程退出事件
electronProcess.on('close', (code) => {
  console.log(`[状态] Electron 应用退出，退出码: ${code}`);
  
  // 确保脚本退出码与 Electron 应用退出码一致
  process.exitCode = code;
});