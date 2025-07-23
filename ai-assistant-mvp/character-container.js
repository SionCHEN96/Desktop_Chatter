// character-container.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';
import { VRMHumanBoneName } from '@pixiv/three-vrm-core';

// 容器元素定义
let characterContainer = null;
let scene, camera, renderer, vrm;
const clock = new THREE.Clock();

// 容器样式
const containerStyles = {
  // 从 styles.css 迁移的样式
  position: 'absolute',
  bottom: '200px',
  left: '0',
};

// 初始化容器
export function initCharacterContainer() {
  console.log('VRM:', VRM);
  console.log('VRM static methods:', Object.getOwnPropertyNames(VRM));
  characterContainer = document.getElementById('character-container');
  if (characterContainer) {
    const width = characterContainer.clientWidth;
    const height = 200;

    // 初始化3D场景
    initCharacter3D(width, height);

    return { width, height, scene, camera, vrm };
  }
  return null;
}

// 初始化3D角色
function initCharacter3D(width, height) {
  // 检查容器尺寸
  console.log('container size:', characterContainer.clientWidth, characterContainer.clientHeight);

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
  characterContainer.appendChild(renderer.domElement);

  // 增强灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(0, 1, 1);
  scene.add(directionalLight);

  // three-vrm插件注册
  const loader = new GLTFLoader();
  if (loader.register) {
    loader.register((parser) => new VRMLoaderPlugin(parser));
  } else if (loader.pluginCallbacks) {
    loader.pluginCallbacks.push((parser) => new VRMLoaderPlugin(parser));
  } else if (loader.plugins) {
    loader.plugins.push(new VRMLoaderPlugin(loader.parser));
  }

  loader.load(
    'Lina_VRM.vrm',
    (gltf) => {
      vrm = gltf.userData.vrm;
      if (!vrm) {
        console.error('未能在 gltf.userData.vrm 中找到 VRM 模型');
        return;
      }
      vrm.scene.scale.set(2, 2, 2); // 角色模型为原始大小的2倍
      vrm.scene.position.set(0, 0, 0); // 还原位置
      vrm.scene.rotation.y = Math.PI; // 让模型正对摄像机
      scene.add(vrm.scene);
      console.log('VRM 加载完成', vrm);
      // 输出所有 mesh 的材质信息
      vrm.scene.traverse((obj) => {
        if (obj.isMesh) {
          console.log('Mesh:', obj.name, 'Material:', obj.material);
        }
      });
    },
    (progress) => {
      const percent = progress.total
        ? (100.0 * (progress.loaded / progress.total)).toFixed(2)
        : '...';
      console.log('Loading model...', percent, '%');
    },
    (error) => console.error('Error loading VRM model:', error)
  );

  // 调整相机位置
  camera.position.set(0, 1, 2.5); // 更高更远
  camera.lookAt(0, 1, 0); // 看向模型中心

  // 输出场景内容
  console.log('scene children:', scene.children);

  // 渲染循环
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
}

// 动画循环
function animate() {
  requestAnimationFrame(animate);

  if (vrm) {
    // 让头部左右轻微摇摆
    const elapsedTime = Date.now() / 1000;
    const headBone = vrm.humanoid?.getBoneNode(VRMHumanBoneName.Head);

    if (headBone) {
      headBone.rotation.y = Math.sin(elapsedTime) * 0.1;
    }

    if (vrm.expressionManager) {
      // 让“joy”表情在0.3~0.7之间波动
      vrm.expressionManager.setValue('joy', 0.5 + 0.2 * Math.sin(elapsedTime * 2));
    }

    // 播放 idle 动画
    if (vrm.meta && vrm.meta.motion) {
      const idleAnimation = vrm.meta.motion.idle;
      if (idleAnimation) {
        vrm.playAnimation(idleAnimation);
      }
    }

    if (vrm.update) {
      vrm.update(clock.getDelta());
    }
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// 导出容器元素和3D对象
export { characterContainer, scene, camera, vrm };