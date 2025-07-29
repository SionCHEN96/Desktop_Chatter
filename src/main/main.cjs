async function loadMain() {
  try {
    const mainModule = await import('./main.js');
    // 如果main.js导出了一个初始化函数，可以在这里调用它
    // mainModule.initialize();
  } catch (error) {
    console.error('Failed to load main module:', error);
  }
}

loadMain();