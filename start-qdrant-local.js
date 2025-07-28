#!/usr/bin/env node

// 启动脚本：启动 Qdrant 数据库并运行 Electron 应用

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 确保qdrant_data目录存在
const qdrantDataDir = join(__dirname, 'qdrant_data');
if (!existsSync(qdrantDataDir)) {
  mkdirSync(qdrantDataDir, { recursive: true });
  console.log('创建Qdrant数据目录:', qdrantDataDir);
}

// 检查 Docker 是否可用
const dockerCheck = spawn('docker', ['--version'], { shell: true });

dockerCheck.on('error', (error) => {
  console.error('错误: 无法执行 Docker 命令');
  console.error('请确保已安装 Docker Desktop: https://www.docker.com/products/docker-desktop/');
  process.exit(1);
});

dockerCheck.on('close', (code) => {
  if (code !== 0) {
    console.error('错误: 未找到 Docker');
    console.error('请确保已安装 Docker Desktop: https://www.docker.com/products/docker-desktop/');
    process.exit(1);
  } else {
    console.log('Docker 检查通过，正在启动 Qdrant 数据库...');
    startQdrant();
  }
});

function startQdrant() {
  // 启动 Qdrant Docker 容器，使用Windows兼容的路径格式
  const qdrant = spawn('docker', [
    'run', 
    '-d', 
    '--rm',
    '-p', '6333:6333', 
    '-p', '6334:6334',
    '--name', 'qdrant-db',
    '-v', `${__dirname.replace(/\\/g, '/')}/qdrant_data:/qdrant/storage`,
    'qdrant/qdrant'
  ], { shell: true });

  qdrant.stdout.on('data', (data) => {
    console.log(`Qdrant stdout: ${data}`);
  });

  qdrant.stderr.on('data', (data) => {
    console.error(`Qdrant stderr: ${data}`);
  });

  qdrant.on('close', (code) => {
    if (code === 0) {
      console.log('Qdrant 数据库启动成功');
      // 等待 Qdrant 完全启动后再启动 Electron 应用
      setTimeout(() => {
        console.log('正在启动 Electron 应用...');
        startElectron();
      }, 5000); // 等待 5 秒确保 Qdrant 完全启动
    } else {
      console.error(`Qdrant 数据库启动失败，退出码: ${code}`);
      process.exit(code);
    }
  });
}

function startElectron() {
  // 启动 Electron 应用
  const electron = spawn('electron', ['.'], { 
    shell: true,
    cwd: __dirname,
    stdio: 'inherit'
  });

  electron.on('close', (code) => {
    console.log(`Electron 应用退出，退出码: ${code}`);
    // 停止 Qdrant 容器
    const stopQdrant = spawn('docker', ['stop', 'qdrant-db'], { shell: true });
    stopQdrant.on('close', () => {
      process.exit(code);
    });
  });
}