// character-container.js
import * as THREE from '../node_modules/three/build/three.module.js';

// 容器元素定义
let characterContainer = null;
let scene, camera, renderer, cube;

// 容器样式
const containerStyles = {
  // 从 styles.css 迁移的样式
  position: 'absolute',
  bottom: '200px',
  left: '0',
};

// 初始化容器
export function initCharacterContainer() {
  characterContainer = document.getElementById('character-container');
  if (characterContainer) {
    const width = characterContainer.clientWidth;
    const height = 200;
    
    // 初始化3D场景
    initCharacter3D(width, height);
    
    return { width, height, scene, camera, cube };
  }
  return null;
}

// 初始化3D角色
function initCharacter3D(width, height) {
  // 创建场景
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  characterContainer.appendChild(renderer.domElement);

  // 创建立方体材质(淡黄色)
  const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const material = new THREE.MeshPhongMaterial({
    color: 0xFFFFCC,
    specular: 0xFFFFFF,
    shininess: 100,
    transparent: true,
    opacity: 0.9
  });
  cube = new THREE.Mesh(geometry, material);

  // 增强光照
  const ambientLight = new THREE.AmbientLight(0x808080);
  scene.add(ambientLight);

  const directionalLight1 = new THREE.DirectionalLight(0xFFFFFF, 1.0);
  directionalLight1.position.set(-1, 1, 1).normalize();
  scene.add(directionalLight1);

  const directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 0.5);
  directionalLight2.position.set(1, 1, -1).normalize();
  scene.add(directionalLight2);

  scene.add(cube);

  // 调整相机位置
  camera.position.z = 2;
  camera.position.y = 0.3;

  // 开始动画
  animate();
}

// 动画循环
function animate() {
  requestAnimationFrame(animate);
  if (cube) {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
  }
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// 导出容器元素和3D对象
export { characterContainer, scene, camera, cube };