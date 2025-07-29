/**
 * 动画状态机模块
 * 处理角色动画状态转换和管理
 */

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { CONTAINER_STYLES } from '../../config/index.js';
import { AnimationStateMachine } from '../animation/index.js';

// 容器元素定义
let characterContainer = null;
let scene, camera, renderer;
let fbxModel; // FBX模型
let mixer; // Animation mixer for the FBX animation
const clock = new THREE.Clock();
let animationStateMachine = null; // 动画状态机实例

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

    // 初始化3D模型拖拽功能
    initModelDrag();

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
  // 增加FOV到90度，扩大视野范围，确保能看到完整的模型
  camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 1000);
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
  renderer.useLegacyLights = false; // 使用物理正确的光照计算（替换已被移除的physicallyCorrectLights）

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

    // 调整模型在场景中的位置和缩放，配合新的容器设置
    fbxModel.position.set(0, -2.5, 0); // 大幅降低模型位置，确保脚部可见
    fbxModel.scale.set(1.6, 1.6, 1.6); // 适当放大模型，利用容器的高度空间

    // 计算模型的边界盒，用于调试
    const box = new THREE.Box3().setFromObject(fbxModel);
    console.log('模型边界盒:', box);
    console.log('模型高度:', box.max.y - box.min.y);
    console.log('模型最低点:', box.min.y);
    console.log('模型最高点:', box.max.y);

    scene.add(fbxModel);

    // 调整相机位置以更好地显示完整模型 - 配合90度FOV
    camera.position.set(0, -0.5, 1.5); // 降低相机高度到模型中心，确保能看到完整模型
    camera.lookAt(0, -1, 0); // 让相机看向模型中心位置

    // 创建动画混合器
    mixer = new THREE.AnimationMixer(fbxModel);

    // 创建动画状态机
    animationStateMachine = new AnimationStateMachine().init(scene, fbxModel, mixer);

    // 应用一个自然的初始姿势，避免T-pose
    // 遍历模型骨骼并应用自然姿势
    fbxModel.traverse((child) => {
      if (child.isBone) {
        // 应用自然的初始姿势，让手臂轻微下垂
        if (child.name.includes('Arm')) {
          child.rotation.x = -0.2; // 轻微向下
        } else if (child.name.includes('ForeArm')) {
          child.rotation.x = -0.3; // 轻微弯曲
        }
      }
    });

    // 预加载所有动画
    animationStateMachine.preloadAnimations().then(() => {
      // 加载完成后播放idle动画
      animationStateMachine.transitionTo('idle');
    });

    console.log('FBX模型加载完成');
  }, undefined, (error) => {
    console.error('加载FBX模型时出错:', error);
  });
}

// 添加播放指定动画的函数
export function playAnimation(animationName) {
  console.log('尝试通过状态机播放动画:', animationName);

  // 检查动画状态机是否已初始化
  if (!animationStateMachine) {
    console.warn('动画状态机尚未初始化');
    return;
  }

  // 通过状态机播放动画
  animationStateMachine.transitionTo(animationName);
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

// 拖拽相关变量
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let pendingMove = null;

// 初始化3D模型拖拽功能
function initModelDrag() {
  console.log('[拖拽功能] 开始初始化拖拽功能');

  if (!characterContainer) {
    console.error('[拖拽功能] characterContainer 未找到');
    return;
  }

  console.log('[拖拽功能] characterContainer 找到，开始添加事件监听器');

  // 调试：检查元素状态
  const computedStyle = window.getComputedStyle(characterContainer);
  console.log('[拖拽功能] 元素状态检查:', {
    display: computedStyle.display,
    visibility: computedStyle.visibility,
    pointerEvents: computedStyle.pointerEvents,
    zIndex: computedStyle.zIndex,
    position: computedStyle.position,
    width: characterContainer.offsetWidth,
    height: characterContainer.offsetHeight,
    left: characterContainer.offsetLeft,
    top: characterContainer.offsetTop
  });

  // 鼠标按下事件
  characterContainer.addEventListener('mousedown', (event) => {
    console.log('[拖拽功能] 鼠标按下事件触发', event.button);

    // 只响应左键点击
    if (event.button !== 0) return;

    isDragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;

    console.log('[拖拽功能] 开始拖拽', { dragStartX, dragStartY });

    // 改变鼠标样式
    characterContainer.style.cursor = 'grabbing';

    // 阻止默认行为
    event.preventDefault();
  });

  // 鼠标移动事件 - 使用requestAnimationFrame确保平滑移动
  document.addEventListener('mousemove', (event) => {
    if (!isDragging) return;

    // 计算移动距离
    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;

    // 只有移动距离足够大时才处理，避免微小抖动
    if (Math.abs(deltaX) < 2 && Math.abs(deltaY) < 2) {
      return;
    }

    // 取消之前的pending move
    if (pendingMove) {
      cancelAnimationFrame(pendingMove);
    }

    // 使用requestAnimationFrame确保平滑移动
    pendingMove = requestAnimationFrame(() => {
      console.log('[拖拽功能] 鼠标移动', { deltaX, deltaY });

      // 通过IPC发送窗口移动请求
      if (window.electronAPI && window.electronAPI.moveWindow) {
        window.electronAPI.moveWindow(deltaX, deltaY);
      } else {
        console.error('[拖拽功能] electronAPI.moveWindow 不可用');
      }

      pendingMove = null;
    });

    // 更新起始位置
    dragStartX = event.clientX;
    dragStartY = event.clientY;
  });

  // 鼠标释放事件
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      console.log('[拖拽功能] 结束拖拽');
      isDragging = false;
      characterContainer.style.cursor = 'grab';

      // 清理pending move
      if (pendingMove) {
        cancelAnimationFrame(pendingMove);
        pendingMove = null;
      }
    }
  });

  // 设置初始鼠标样式
  characterContainer.style.cursor = 'grab';
  console.log('[拖拽功能] 拖拽功能初始化完成');
}
