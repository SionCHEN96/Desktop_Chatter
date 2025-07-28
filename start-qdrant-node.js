function installQdrantNode() {
  console.log('正在安装 Qdrant Node.js 包...');
  const install = spawn('npm', ['install', '@qdrant/qdrant-node'], { shell: true });
  
  install.stdout.on('data', (data) => {
    process.stdout.write(data);
  });
  
  install.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
  
  install.on('close', (code) => {
    if (code === 0) {
      console.log('Qdrant Node.js 包安装成功');
      startQdrantNode();
    } else {
      console.error('Qdrant Node.js 包安装失败，将使用默认方案');
      startElectronDirect();
    }
  });
}

function startQdrantNode() {
  console.log('启动 Qdrant Node.js 服务...');
  
  // 启动 Qdrant Node.js 服务
  const qdrant = spawn('node', ['-e', `
    import("@qdrant/qdrant-node").then(({ Qdrant }) => {
      const qdrant = new Qdrant({
        host: "localhost",
        port: 6333,
        storage: "${join(__dirname, 'qdrant_data').replace(/\\/g, '/')}"
      });
      
      qdrant.start().then(() => {
        console.log("Qdrant Node.js 服务启动成功");
      }).catch((error) => {
        console.error("Qdrant Node.js 服务启动失败:", error);
        process.exit(1);
      });
    }).catch((error) => {
      console.error("无法加载 Qdrant Node.js 包:", error);
      process.exit(1);
    });
  `], { 
    shell: true,
    cwd: __dirname,
    stdio: 'inherit'
  });

  qdrant.on('close', (code) => {
    if (code === 0) {
      console.log('Qdrant Node.js 服务启动完成');
      // 等待 Qdrant 完全启动后再启动 Electron 应用
      setTimeout(() => {
        console.log('正在启动 Electron 应用...');
        startElectron();
      }, 3000); // 等待 3 秒确保 Qdrant 完全启动
    } else {
      console.error(`Qdrant Node.js 服务启动失败，退出码: ${code}`);
      startElectronDirect(); // 直接启动Electron应用，使用降级存储
    }
  });
}

function startElectronDirect() {
  console.log('直接启动 Electron 应用 (使用降级存储方案)...');
  startElectron();
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
    process.exit(code);
  });
}