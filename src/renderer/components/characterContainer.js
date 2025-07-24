import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';
import { VRMHumanBoneName } from '@pixiv/three-vrm-core';
import { CONTAINER_STYLES } from '../../constants/appConstants.js';

// 容器元素定义
let characterContainer = null;
let scene, camera, renderer, vrm;
const clock = new THREE.Clock();

// 初始化容器
export function initCharacterContainer() {
  console.log('VRM:', VRM);
  console.log('VRM static methods:', Object.getOwnPropertyNames(VRM));
  characterContainer = document.getElementById('character-container');
  if (characterContainer) {
    // 获取容器的实际尺寸
    const width = characterContainer.clientWidth;
    const height = characterContainer.clientHeight;

    // 初始化3D场景
    initCharacter3D(width, height);

    // 监听窗口大小变化，重新调整渲染器尺寸
    window.addEventListener('resize', onWindowResize);

    return { width, height, scene, camera, vrm };
  }
  return null;
}

// 窗口大小变化处理函数
function onWindowResize() {
  if (characterContainer && camera && renderer) {
    const width = characterContainer.clientWidth;
    const height = characterContainer.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
  }
}

// 初始化3D角色
function initCharacter3D(width, height) {
  // 检查容器尺寸
  console.log('container size:', width, height);

  // 创建场景
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  // 色彩空间和色调映射设置
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // 应用容器样式
  Object.assign(characterContainer.style, CONTAINER_STYLES);

  characterContainer.appendChild(renderer.domElement);

  // 添加光源
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // 加载VRM模型
  loadVRMModel();

  // 开始渲染循环
  animate();
}

// 加载VRM模型
function loadVRMModel() {
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));

  // 注意：模型路径需要正确指向public/models目录下的模型文件
  loader.load('./public/models/Lina_VRM.vrm', (gltf) => {
    vrm = gltf.userData.vrm;

    // 获取容器的实际尺寸
    const containerWidth = characterContainer.clientWidth;
    const containerHeight = characterContainer.clientHeight;

    // 假设模型原始尺寸为1单位长度，根据容器尺寸计算缩放比例
    const scale = Math.min(containerWidth / 200, containerHeight / 300); // 根据实际情况调整200和300

    // 调整模型位置和缩放
    vrm.scene.rotation.y = Math.PI;
    // 增加模型缩放比例，使其更适合显示区域
    vrm.scene.scale.set(0.8, 0.8, 0.8);
    scene.add(vrm.scene);

    // 调整相机位置以更好地显示模型，拉近相机距离
    camera.position.set(0, 1, 1.5);
  }, undefined, (error) => {
    console.error('加载VRM模型时出错:', error);
  });
}

// 动画循环
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (vrm) {
    vrm.update(delta);
  }

  renderer.render(scene, camera);
}

// 添加简单动作
export function playSimpleAnimation() {
  if (vrm) {
    // 简单的挥手动作示例
    const rightArm = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightUpperArm);
    if (rightArm) {
      rightArm.rotation.z = Math.sin(clock.getElapsedTime()) * 0.5;
    }
  }
}