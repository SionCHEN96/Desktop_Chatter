// 高级Qdrant启动脚本，可以处理Docker Desktop上下文切换

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
    checkDockerContext();
  }
});

function checkDockerContext() {
  console.log('检查Docker上下文...');
  exec('docker context ls --format "{{.Name}} {{.Current}}"', (error, stdout) => {
    if (error) {
      console.error('检查Docker上下文失败:', error.message);
      process.exit(1);
    } else {
      const contexts = stdout.trim().split('\n');
      let defaultContext = null;
      let currentContext = null;
      
      contexts.forEach(line => {
        const [name, isCurrent] = line.trim().split(' ');
        if (name === 'default') {
          defaultContext = name;
        }
        if (isCurrent === '*') {
          currentContext = name;
        }
      });
      
      console.log(`当前Docker上下文: ${currentContext}`);
      
      // 如果当前不是默认上下文，切换到默认上下文
      if (currentContext !== 'default' && defaultContext) {
        console.log('正在切换到默认Docker上下文...');
        exec('docker context use default', (switchError) => {
          if (switchError) {
            console.error('切换Docker上下文失败:', switchError.message);
            process.exit(1);
          } else {
            console.log('已切换到默认Docker上下文');
            checkDockerDaemon();
          }
        });
      } else {
        checkDockerDaemon();
      }
    }
  });
}

function checkDockerDaemon() {
  console.log('检查Docker守护进程...');
  exec('docker info', (error, stdout, stderr) => {
    if (error) {
      console.error('Docker连接错误，请确保Docker Desktop正在运行:');
      console.error(stderr);
      // 尝试重启Docker服务
      console.log('尝试重启Docker服务...');
      restartDocker();
    } else {
      console.log('Docker守护进程运行正常');
      startQdrantContainer();
    }
  });
}

function restartDocker() {
  console.log('请手动重启Docker Desktop服务，然后重新运行此脚本。');
  console.log('或者使用以下步骤:');
  console.log('1. 打开Docker Desktop');
  console.log('2. 如果看到"Switch to Windows containers"选项，请点击切换');
  console.log('3. 等待Docker Desktop重启完成');
  console.log('4. 重新运行 npm run start-qdrant');
  process.exit(1);
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
  const maxAttempts = 60; // 最多等待60秒，给更多时间
  
  function checkQdrant() {
    attempts++;
    console.log(`检查Qdrant服务... (尝试 ${attempts}/${maxAttempts})`);
    
    // 使用更简单的检查方法，不依赖容器内的curl命令
    exec('docker logs qdrant-db | findstr "waiting for byte"', (logError, stdout) => {
      if (!logError && stdout) {
        console.log('Qdrant服务已准备就绪');
        // 等待额外几秒钟确保服务完全启动
        setTimeout(startElectronApp, 3000);
      } else {
        // 检查容器是否仍在运行
        exec('docker ps --format "{{.Names}}"', (psError, psStdout) => {
          if (!psError && psStdout.includes('qdrant-db')) {
            // 容器仍在运行，继续检查
            if (attempts < maxAttempts) {
              setTimeout(checkQdrant, 1000);
            } else {
              console.log('Qdrant服务应该已启动，请手动检查服务状态');
              startElectronApp();
            }
          } else {
            console.error('Qdrant容器已停止运行');
            process.exit(1);
          }
        });
      }
    });
  }
  
  setTimeout(checkQdrant, 5000); // 先等5秒再开始检查
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