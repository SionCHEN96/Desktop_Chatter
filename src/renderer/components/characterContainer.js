import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { CONTAINER_STYLES } from '../../constants/appConstants.js';
import { ANIMATION_CONFIG } from '../../constants/animationConfig.js';

// 容器元素定义
let characterContainer = null;
let scene, camera, renderer;
let fbxModel; // FBX模型
let mixer; // Animation mixer for the FBX animation
const clock = new THREE.Clock();

// 初始化容器
export function initCharacterContainer() {
  characterContainer = document.getElementById('character-container');
  if (characterContainer) {
    // 获取容器的实际尺寸
    const width = characterContainer.clientWidth;
    const height = characterContainer.clientHeight;

    // 初始化3D场景
    initCharacter3D(width, height);

    // 监听窗口大小变化，重新调整渲染器尺寸
    window.addEventListener('resize', onWindowResize);

    return { width, height, scene, camera };
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
  scene.background = null;
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ 
    alpha: true,
    antialias: true, // 启用抗锯齿提高渲染质量
    powerPreference: "high-performance",
    stencil: true,
    depth: true,
    logarithmicDepthBuffer: true // 启用对数深度缓冲区以改善深度渲染
  });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  renderer.setClearAlpha(0);
  // 提高渲染质量的设置
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2; // 稍微增加曝光以获得更好的视觉效果
  renderer.shadowMap.enabled = true; // 启用阴影贴图
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 使用柔和阴影
  renderer.physicallyCorrectLights = true; // 使用物理正确的光照计算

  // 应用容器样式
  Object.assign(characterContainer.style, CONTAINER_STYLES);

  characterContainer.appendChild(renderer.domElement);

  // 使用3光源打光规则
  // 1. 主光源 - 用于主要照明
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.0); // 增加主光源强度
  keyLight.position.set(5, 5, 5);
  keyLight.castShadow = true;
  // 设置更高质量的阴影参数以提高阴影质量
  keyLight.shadow.mapSize.width = 2048; // 提高阴影贴图分辨率
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 50;
  keyLight.shadow.camera.left = -10;
  keyLight.shadow.camera.right = 10;
  keyLight.shadow.camera.top = 10;
  keyLight.shadow.camera.bottom = -10;
  // 启用物理正确的阴影计算
  keyLight.shadow.radius = 2; // 增加阴影半径使阴影更柔和
  scene.add(keyLight);

  // 2. 补光 - 用于填充阴影区域
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.4); // 稍微增加补光强度
  fillLight.position.set(-5, 3, -5);
  scene.add(fillLight);

  // 3. 轮廓光/背光 - 用于分离主体与背景
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.6); // 稍微增加轮廓光强度
  rimLight.position.set(0, 5, -5);
  scene.add(rimLight);

  // 环境光提供基础照明
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // 稍微增加环境光强度
  scene.add(ambientLight);

  // 添加一个轻微的天光效果
  const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.2);
  scene.add(hemisphereLight);

  // 加载FBX模型
  loadFBXModel();

  // 开始渲染循环
  animate();
}

// 加载FBX模型
function loadFBXModel() {
  const loader = new FBXLoader();
  
  // 加载模型
  loader.load('./public/models/Lina.fbx', (object) => {
    fbxModel = object;
    
    // 输出模型信息用于调试
    console.log('FBX模型加载完成:', object);
    console.log('模型子对象数量:', object.children.length);
    
    // 遍历模型子对象，检查材质
    object.traverse((child) => {
      if (child.isMesh) {
        console.log('网格对象:', child.name);
        console.log('材质信息:', child.material);
        console.log('几何体信息:', child.geometry);
        
        // 如果材质存在，启用必要的渲染特性
        if (child.material) {
          child.material.side = THREE.DoubleSide;
          // 启用深度测试和深度写入
          child.material.depthTest = true;
          child.material.depthWrite = true;
          // 启用投射和接收阴影
          child.castShadow = true;
          child.receiveShadow = true;
          
          // 提高材质渲染质量
          child.material.shininess = 30; // 增加材质光泽度
          child.material.flatShading = false; // 使用平滑着色而非平面着色
          
          // 如果材质支持，启用更高质量的渲染选项
          if (child.material.type === 'MeshPhongMaterial' || child.material.type === 'MeshStandardMaterial') {
            child.material.polygonOffset = true;
            child.material.polygonOffsetFactor = 1;
            child.material.polygonOffsetUnits = 1;
          }
        }
      }
      
      // 如果子对象是光源，启用投射阴影
      if (child.isLight) {
        child.castShadow = true;
      }
    });

    // 调整模型位置和缩放，使角色正对观众
    fbxModel.rotation.y = 0; // 将旋转从Math.PI改为0，使角色正对观众
    fbxModel.scale.set(0.8, 0.8, 0.8);
    // 启用模型投射和接收阴影
    fbxModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(fbxModel);

    // 调整相机位置以更好地显示模型 - 靠近角色
    camera.position.set(0, 1, 1.5); // 从(0, 1, 2)调整为(0, 1, 1.5)，更靠近角色
    
    // 创建动画混合器
    mixer = new THREE.AnimationMixer(fbxModel);
    
    // 加载并播放idle动画
    loadFBXAnimation();
    
    console.log('FBX模型加载完成');
  }, undefined, (error) => {
    console.error('加载FBX模型时出错:', error);
  });
}

// 加载FBX idle动画
function loadFBXAnimation() {
  const loader = new FBXLoader();
  
  // 使用配置文件中的idle动画资源
  const idleAnimation = ANIMATION_CONFIG.idle;
  
  loader.load(idleAnimation.resource, (object) => {
    // 检查是否有动画剪辑
    if (object.animations && object.animations.length > 0) {
      console.log('找到动画剪辑:', object.animations.length, '个');
      
      // 播放第一个动画（假设为idle动画）
      const action = mixer.clipAction(object.animations[0]);
      action.play();
      
      console.log('开始播放', idleAnimation.name, '动画');
    } else {
      console.warn('未找到动画剪辑');
    }
  }, undefined, (error) => {
    console.error('加载FBX动画时出错:', error);
  });
}

// 添加播放指定动画的函数
export function playAnimation(animationName) {
  // 检查动画配置中是否存在该动画
  if (!ANIMATION_CONFIG[animationName]) {
    console.warn('未找到动画配置:', animationName);
    return;
  }
  
  const animation = ANIMATION_CONFIG[animationName];
  
  // 停止当前所有动画
  if (mixer) {
    mixer.stopAllAction();
  }
  
  // 加载并播放指定动画
  const loader = new FBXLoader();
  loader.load(animation.resource, (object) => {
    if (object.animations && object.animations.length > 0) {
      console.log('加载动画:', animation.name);
      
      // 播放动画
      const action = mixer.clipAction(object.animations[0]);
      action.play();
      
      console.log('开始播放', animation.name, '动画');
    } else {
      console.warn('动画文件中未找到动画剪辑:', animation.resource);
    }
  }, undefined, (error) => {
    console.error('加载动画时出错:', animationName, error);
  });
}

// 动画循环
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  
  // 更新FBX动画
  if (mixer) {
    mixer.update(delta);
  }

  renderer.render(scene, camera);
}

// 添加简单动作
export function playSimpleAnimation() {
  // 对于FBX模型，暂时不实现特殊动画
  console.log("播放简单动画");
}
