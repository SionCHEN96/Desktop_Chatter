/**
 * 动画状态机模块
 * 处理角色动画状态转换和管理
 */

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { CONTAINER_STYLES } from '../../config/index.js';
import { AnimationStateMachine } from '../animation/index.js';
import { SimpleHighQualityRenderer } from '../rendering/SimpleHighQualityRenderer.js';

// 容器元素定义
let characterContainer = null;
let highQualityRenderer = null; // 高质量渲染器
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
  if (characterContainer && highQualityRenderer) {
    highQualityRenderer.onWindowResize();
  } else if (characterContainer && camera && renderer) {
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

  // 创建高质量渲染器
  highQualityRenderer = new SimpleHighQualityRenderer(characterContainer);

  // 获取渲染器组件的引用（为了兼容性）
  scene = highQualityRenderer.scene;
  camera = highQualityRenderer.camera;
  renderer = highQualityRenderer.renderer;

  // 应用容器样式
  Object.assign(characterContainer.style, CONTAINER_STYLES);

  // 高质量渲染器已经包含了优化的光照系统

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

    // 使用高质量渲染器优化模型材质
    console.log('FBX模型子对象数量:', object.children.length);

    // 调整模型在场景中的位置和缩放，配合新的容器设置
    fbxModel.position.set(0, -1.5, 0); // 大幅降低模型位置，确保脚部可见
    let scale = 0.6;
    fbxModel.scale.set(scale, scale, scale);

    // 计算模型的边界盒，用于调试
    const box = new THREE.Box3().setFromObject(fbxModel);
    console.log('模型边界盒:', box);
    console.log('模型高度:', box.max.y - box.min.y);
    console.log('模型最低点:', box.min.y);
    console.log('模型最高点:', box.max.y);

    // 使用高质量渲染器添加模型（自动优化材质）
    highQualityRenderer.addModel(fbxModel);

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

  // 使用高质量渲染器渲染
  if (highQualityRenderer) {
    highQualityRenderer.render();
  } else {
    renderer.render(scene, camera);
  }
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
let currentX = 0;
let currentY = 0;
let targetX = 0;
let targetY = 0;
let animationId = null;
let lastMouseTime = 0;
let mouseVelocityX = 0;
let mouseVelocityY = 0;
const BASE_SMOOTHING = 0.15; // 基础平滑系数
const MAX_SMOOTHING = 0.8;   // 最大平滑系数（快速移动时）
const VELOCITY_THRESHOLD = 50; // 速度阈值，超过此值认为是快速移动

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
    currentX = 0;
    currentY = 0;
    targetX = 0;
    targetY = 0;
    lastMouseTime = Date.now();
    mouseVelocityX = 0;
    mouseVelocityY = 0;

    console.log('[拖拽功能] 开始拖拽', { dragStartX, dragStartY });

    // 改变鼠标样式
    characterContainer.style.cursor = 'grabbing';

    // 启动平滑动画
    startSmoothAnimation();

    // 阻止默认行为
    event.preventDefault();
  });

  // 鼠标移动事件 - 更新目标位置并计算速度
  document.addEventListener('mousemove', (event) => {
    if (!isDragging) return;

    // 计算移动距离
    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;

    // 计算鼠标移动速度
    const currentTime = Date.now();
    const timeDelta = currentTime - lastMouseTime;

    if (timeDelta > 0) {
      mouseVelocityX = Math.abs(deltaX) / timeDelta * 1000; // 像素/秒
      mouseVelocityY = Math.abs(deltaY) / timeDelta * 1000;
    }

    lastMouseTime = currentTime;

    // 更新目标位置
    targetX += deltaX;
    targetY += deltaY;

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

      // 停止平滑动画
      stopSmoothAnimation();
    }
  });

  // 设置初始鼠标样式
  characterContainer.style.cursor = 'grab';
  console.log('[拖拽功能] 拖拽功能初始化完成');
}

// 启动平滑动画
function startSmoothAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  function animate() {
    if (!isDragging) {
      stopSmoothAnimation();
      return;
    }

    // 计算当前位置到目标位置的差值
    const deltaX = targetX - currentX;
    const deltaY = targetY - currentY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 根据鼠标速度和距离动态调整平滑系数
    const maxVelocity = Math.max(mouseVelocityX, mouseVelocityY);
    let smoothingFactor = BASE_SMOOTHING;

    // 如果鼠标移动很快或距离很远，增加平滑系数
    if (maxVelocity > VELOCITY_THRESHOLD || distance > 50) {
      const velocityFactor = Math.min(maxVelocity / VELOCITY_THRESHOLD, 5); // 最多5倍速度
      const distanceFactor = Math.min(distance / 50, 3); // 最多3倍距离
      smoothingFactor = Math.min(BASE_SMOOTHING * Math.max(velocityFactor, distanceFactor), MAX_SMOOTHING);
    }

    // 如果距离很远，直接跳跃一部分距离
    if (distance > 100) {
      // 对于很远的距离，直接移动一半距离
      const jumpX = deltaX * 0.5;
      const jumpY = deltaY * 0.5;

      console.log('[拖拽功能] 快速跳跃', {
        distance: Math.round(distance),
        jumpX: Math.round(jumpX),
        jumpY: Math.round(jumpY)
      });

      if (window.electronAPI && window.electronAPI.moveWindow) {
        window.electronAPI.moveWindow(Math.round(jumpX), Math.round(jumpY));
      }

      currentX += jumpX;
      currentY += jumpY;
    } else if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) {
      // 如果差值足够小，直接跳到目标位置
      currentX = targetX;
      currentY = targetY;
    } else {
      // 使用动态平滑系数进行插值移动
      const moveX = deltaX * smoothingFactor;
      const moveY = deltaY * smoothingFactor;

      // 只有移动距离足够大时才发送IPC
      if (Math.abs(moveX) > 0.5 || Math.abs(moveY) > 0.5) {
        console.log('[拖拽功能] 平滑移动', {
          smoothingFactor: smoothingFactor.toFixed(2),
          velocity: Math.round(maxVelocity),
          distance: Math.round(distance),
          moveX: Math.round(moveX),
          moveY: Math.round(moveY)
        });

        // 发送移动请求
        if (window.electronAPI && window.electronAPI.moveWindow) {
          window.electronAPI.moveWindow(Math.round(moveX), Math.round(moveY));
        } else {
          console.error('[拖拽功能] electronAPI.moveWindow 不可用');
        }

        // 更新当前位置
        currentX += moveX;
        currentY += moveY;
      }
    }

    // 继续动画
    animationId = requestAnimationFrame(animate);
  }

  animate();
}

// 停止平滑动画
function stopSmoothAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}
