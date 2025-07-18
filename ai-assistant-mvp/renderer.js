import * as THREE from '../node_modules/three/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
  // 初始化3D角色
  const { sendMessage, onResponse } = window.electronAPI;
  const container = document.getElementById('character-container');
  if (container) {
    const width = container.clientWidth;
    const height = 200;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 创建立方体材质(淡黄色)
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0xFFFFCC,
      specular: 0x111111,
      shininess: 30
    });
    const sphere = new THREE.Mesh(geometry, material);

    // 添加光照
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(-1, 1, 1).normalize();
    scene.add(directionalLight);
    scene.add(sphere);

    camera.position.z = 1;

    function animate() {
      requestAnimationFrame(animate);
      sphere.rotation.x += 0.01;
      sphere.rotation.y += 0.01;
      renderer.render(scene, camera);
    }
    animate();
  }

  const chatForm = document.getElementById('chat-form')
  const messageInput = document.getElementById('message-input')
  const chatMessages = document.getElementById('chat-messages')

  // 添加关闭按钮事件监听
  const closeButton = document.getElementById('close-button')
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      window.electronAPI.closeWindow()
    })
  }

  // 处理消息发送
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const message = messageInput.value.trim()
    if (message) {
      addMessage('user', message)
      window.electronAPI.sendMessage(message)
      messageInput.value = ''
    }
  })

  // 添加消息气泡样式
  const style = document.createElement('style');
  style.textContent = `
    .message.ai {
      background: rgba(255, 255, 255, 0.9);
      color: #333;
      padding: 10px 15px;
      border-radius: 18px;
      max-width: 200px;
      word-wrap: break-word;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      font-size: 14px;
      transform: translateY(-100%);
      transition: opacity 0.3s;
    }
    .message.ai.fade-out {
      opacity: 0;
    }
  `;
  document.head.appendChild(style);

  // 添加消息到3D球体上方
  function addMessage(sender, text) {
    if (sender === 'user') {
      // 用户消息不显示，但保留发送功能
      return;
    }

    // 清除之前的AI消息
    const container = document.getElementById('character-container');
    const aiMessages = container.querySelectorAll('.message.ai');
    aiMessages.forEach(msg => msg.remove());

    // 创建消息气泡
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    messageElement.textContent = text;
    container.appendChild(messageElement);

    // 计算球体在屏幕上的位置
    function updateBubblePosition() {
      // 获取球体顶部位置（Y轴减少球体半径）
      const spherePosition = new THREE.Vector3(0, 0.3, 0); // 减少Y轴偏移量
      spherePosition.applyMatrix4(sphere.matrixWorld);
      spherePosition.project(camera);
      
      // 转换为CSS坐标（调整Y轴系数）
      const x = (spherePosition.x * 0.5 + 0.5) * container.clientWidth;
      const y = (0.9 - (spherePosition.y * 0.45)) * container.clientHeight; // 调整系数
      
      // 定位气泡（简化计算）
      messageElement.style.position = 'absolute';
      messageElement.style.left = `${x - messageElement.offsetWidth/2}px`;
      messageElement.style.top = `${y}px`;
    }

    // 初始定位
    updateBubblePosition();
    
    // 动画时持续更新位置
    function animateWithBubble() {
      requestAnimationFrame(animateWithBubble);
      updateBubblePosition();
    }
    animateWithBubble();

    // 设置消息10秒后自动消失
    setTimeout(() => {
      messageElement.classList.add('fade-out');
      setTimeout(() => {
        messageElement.remove();
      }, 500);
    }, 10000);
  }

  // 接收AI回复
  window.electronAPI.onResponse((event, reply) => {
    addMessage('ai', reply)
  })
})