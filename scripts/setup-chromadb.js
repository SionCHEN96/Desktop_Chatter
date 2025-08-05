/**
 * ChromaDB设置脚本
 * 检查和安装ChromaDB依赖
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';

/**
 * 检查Python是否可用
 * @returns {Promise<boolean>}
 */
async function checkPython() {
  return new Promise((resolve) => {
    const pythonCommands = process.platform === 'win32' ? ['python', 'py'] : ['python3', 'python'];
    
    let pythonFound = false;
    let checkedCommands = 0;
    
    pythonCommands.forEach(cmd => {
      const pythonProcess = spawn(cmd, ['--version'], { stdio: 'pipe' });

      pythonProcess.on('close', (code) => {
        checkedCommands++;
        if (code === 0 && !pythonFound) {
          console.log(`✅ Found Python: ${cmd}`);
          pythonFound = true;
          resolve(true);
        } else if (checkedCommands === pythonCommands.length && !pythonFound) {
          resolve(false);
        }
      });

      pythonProcess.on('error', () => {
        checkedCommands++;
        if (checkedCommands === pythonCommands.length && !pythonFound) {
          resolve(false);
        }
      });
    });
  });
}

/**
 * 检查ChromaDB是否已安装
 * @returns {Promise<boolean>}
 */
async function checkChromaDB() {
  return new Promise((resolve) => {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const chromaProcess = spawn(pythonCmd, ['-c', 'import chromadb; print("ChromaDB available")'], { stdio: 'pipe' });

    chromaProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ ChromaDB is already installed');
        resolve(true);
      } else {
        console.log('❌ ChromaDB not found');
        resolve(false);
      }
    });

    chromaProcess.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * 安装ChromaDB
 * @returns {Promise<boolean>}
 */
async function installChromaDB() {
  return new Promise((resolve) => {
    console.log('📦 Installing ChromaDB...');

    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const installProcess = spawn(pythonCmd, ['-m', 'pip', 'install', 'chromadb'], {
      stdio: 'inherit'
    });

    installProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ ChromaDB installed successfully');
        resolve(true);
      } else {
        console.log('❌ Failed to install ChromaDB');
        resolve(false);
      }
    });

    installProcess.on('error', (error) => {
      console.error('❌ Error installing ChromaDB:', error.message);
      resolve(false);
    });
  });
}

/**
 * 主设置函数
 */
async function setupChromaDB() {
  console.log('🚀 Setting up ChromaDB for Desktop Chatter...\n');
  
  // 检查Python
  console.log('1. Checking Python installation...');
  const pythonAvailable = await checkPython();
  
  if (!pythonAvailable) {
    console.log('❌ Python not found. Please install Python 3.8+ first.');
    console.log('   Download from: https://www.python.org/downloads/');
    process.exit(1);
  }
  
  // 检查ChromaDB
  console.log('\n2. Checking ChromaDB installation...');
  const chromaAvailable = await checkChromaDB();
  
  if (!chromaAvailable) {
    console.log('\n3. Installing ChromaDB...');
    const installed = await installChromaDB();
    
    if (!installed) {
      console.log('\n❌ Failed to install ChromaDB automatically.');
      console.log('   Please try installing manually:');
      console.log('   pip install chromadb');
      process.exit(1);
    }
  }
  
  console.log('\n✅ ChromaDB setup completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Run: npm start');
  console.log('   2. ChromaDB will start automatically with the application');
  console.log('   3. Your conversation data will be persistently stored');
}

// 运行设置
setupChromaDB().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
