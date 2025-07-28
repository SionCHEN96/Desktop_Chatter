// 改进的Qdrant启动脚本

const { exec, spawn } = require('child_process');
const { existsSync, mkdirSync } = require('fs');
const { join } = require('path');

// 确保qdrant_data目录存在
const qdrantDataDir = join(process.cwd(), 'qdrant_data');
if (!existsSync(qdrantDataDir)) {
  mkdirSync(qdrantDataDir, { recursive: true });
  console.log('创建Qdrant数据目录:', qdrantDataDir);
}

// 检查Docker是否可用
exec('docker --version', (error, stdout) => {
  if (error) {
    console.error('错误: 未找到Docker，请先安装Docker Desktop: https://www.docker.com/products/docker-desktop/');
    process.exit(1);
  } else {
    console.log('找到Docker:', stdout.trim());
    checkDockerDaemon();
  }
});

function checkDockerDaemon() {
  console.log('检查Docker守护进程...');
  exec('docker info', (error, stdout, stderr) => {
    if (error) {
      console.error('Docker连接错误，请确保Docker Desktop正在运行:');
      console.error(stderr);
      process.exit(1);
    } else {
      console.log('Docker守护进程运行正常');
      startQdrantContainer();
    }
  });
}

function startQdrantContainer() {
  // 先检查是否已经存在同名容器
  exec('docker ps -a --format "{{.Names}}"', (error, stdout) => {
    if (stdout.includes('qdrant-db')) {
      console.log('发现已存在的Qdrant容器，正在启动...');
      exec('docker start qdrant-db', (startError) => {
        if (startError) {
          console.error('启动现有Qdrant容器失败:', startError.message);
          process.exit(1);
        } else {
          console.log('Qdrant容器启动成功');
          waitForQdrant();
        }
      });
    } else {
      console.log('创建新的Qdrant容器...');
      createQdrantContainer();
    }
  });
}

function createQdrantContainer() {
  // 构建适用于当前操作系统的Docker命令
  const cwd = process.cwd().replace(/\\/g, '/');
  let qdrantCmd;
  
  if (process.platform === 'win32') {
    qdrantCmd = `docker run -d -p 6333:6333 -p 6334:6334 --name qdrant-db -v "${cwd}/qdrant_data:/qdrant/storage" qdrant/qdrant`;
  } else {
    qdrantCmd = `docker run -d -p 6333:6333 -p 6334:6334 --name qdrant-db -v "$(pwd)/qdrant_data:/qdrant/storage:z" qdrant/qdrant`;
  }
  
  console.log('执行命令:', qdrantCmd);
  
  exec(qdrantCmd, (runError, runStdout, runStderr) => {
    if (runError) {
      console.error('启动Qdrant容器失败:', runError.message);
      console.error(runStderr);
      process.exit(1);
    } else {
      console.log('Qdrant容器创建并启动成功');
      waitForQdrant();
    }
  });
}

function waitForQdrant() {
  console.log('等待Qdrant服务启动...');
  
  let attempts = 0;
  const maxAttempts = 30; // 最多等待30秒
  
  function checkQdrant() {
    attempts++;
    console.log(`检查Qdrant服务... (尝试 ${attempts}/${maxAttempts})`);
    
    exec('docker exec qdrant-db curl -s http://localhost:6333', (error, stdout) => {
      if (error || !stdout.includes('qdrant')) {
        if (attempts < maxAttempts) {
          setTimeout(checkQdrant, 1000);
        } else {
          console.error('Qdrant服务启动超时');
          process.exit(1);
        }
      } else {
        console.log('Qdrant服务已准备就绪');
        startElectronApp();
      }
    });
  }
  
  setTimeout(checkQdrant, 3000); // 先等3秒再开始检查
}

function startElectronApp() {
  console.log('正在启动 Electron 应用...');
  
  // 启动 Electron 应用
  const electron = spawn('electron', ['.'], { 
    shell: true,
    stdio: 'inherit'
  });

  electron.on('close', (code) => {
    console.log(`Electron 应用退出，退出码: ${code}`);
    // 停止 Qdrant 容器
    console.log('正在停止 Qdrant 容器...');
    exec('docker stop qdrant-db', (stopError) => {
      if (stopError) {
        console.error('停止Qdrant容器时出错:', stopError.message);
      } else {
        console.log('Qdrant容器已停止');
      }
      process.exit(code);
    });
  });
}