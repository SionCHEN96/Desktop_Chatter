import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { ANIMATION_CONFIG } from '../../constants/animationConfig.js';

// 动画状态机类
export class AnimationStateMachine {
  constructor() {
    this.states = new Map();
    this.currentState = null;
    this.previousState = null;
    this.mixer = null;
    this.scene = null;
    this.character = null;
    this.loadedActions = new Map();
    this.isTransitioning = false;
  }

  // 初始化状态机
  init(scene, character, mixer) {
    this.scene = scene;
    this.character = character;
    this.mixer = mixer;
    
    // 定义状态
    this.defineState('idle', {
      animation: 'idle',
      transitions: ['thinking', 'joy', 'sad'],
      loop: true
    });
    
    this.defineState('thinking', {
      animation: 'thinking',
      transitions: ['idle', 'joy', 'sad'],
      loop: true
    });
    
    this.defineState('joy', {
      animation: 'joy',
      transitions: ['idle'],
      loop: false,
      autoTransition: 'idle',
      transitionDelay: 3000
    });
    
    this.defineState('sad', {
      animation: 'sad',
      transitions: ['idle'],
      loop: false,
      autoTransition: 'idle',
      transitionDelay: 3000
    });
    
    return this;
  }

  // 定义状态
  defineState(name, config) {
    this.states.set(name, {
      name,
      animation: config.animation,
      transitions: config.transitions || [],
      loop: config.loop !== false,
      autoTransition: config.autoTransition,
      transitionDelay: config.transitionDelay || 0,
      onEnter: config.onEnter,
      onExit: config.onExit
    });
  }

  // 获取状态
  getState(name) {
    return this.states.get(name);
  }

  // 切换到指定状态
  async transitionTo(stateName, force = false) {
    // 检查状态是否存在
    const targetState = this.states.get(stateName);
    if (!targetState) {
      console.warn(`状态 "${stateName}" 不存在`);
      return false;
    }

    // 如果正在过渡中，等待完成
    if (this.isTransitioning && !force) {
      console.log(`正在过渡到 "${this.currentState?.name}"，等待完成`);
      return false;
    }

    // 如果已经是目标状态且不强制切换
    if (this.currentState?.name === stateName && !force) {
      console.log(`已经处于状态 "${stateName}"`);
      // 重置动画
      if (this.loadedActions.has(stateName)) {
        const action = this.loadedActions.get(stateName);
        action.reset().play();
      }
      return true;
    }

    // 检查是否可以进行状态转换
    if (this.currentState && !this.currentState.transitions.includes(stateName) && !force) {
      console.warn(`无法从状态 "${this.currentState.name}" 转换到 "${stateName}"`);
      return false;
    }

    this.isTransitioning = true;
    this.previousState = this.currentState;
    this.currentState = targetState;

    console.log(`切换到状态: ${stateName}`);

    // 执行退出回调
    if (this.previousState?.onExit) {
      this.previousState.onExit(this);
    }

    // 执行进入回调
    if (targetState.onEnter) {
      targetState.onEnter(this);
    }

    // 播放动画
    await this.playAnimation(stateName, targetState);

    this.isTransitioning = false;

    // 如果有自动转换状态
    if (targetState.autoTransition && targetState.transitionDelay > 0) {
      setTimeout(() => {
        if (this.currentState === targetState) {
          this.transitionTo(targetState.autoTransition);
        }
      }, targetState.transitionDelay);
    }

    return true;
  }

  // 播放动画
  async playAnimation(stateName, stateConfig) {
    const animationName = stateConfig.animation;
    
    // 检查动画是否已加载
    if (!this.loadedActions.has(stateName)) {
      await this.loadAnimation(stateName, animationName);
    }

    // 获取当前播放的动作
    let currentlyPlayingAction = null;
    if (this.mixer) {
      for (let i = 0; i < this.mixer._actions.length; i++) {
        if (this.mixer._actions[i].isRunning()) {
          currentlyPlayingAction = this.mixer._actions[i];
          break;
        }
      }
    }

    // 获取目标动作
    const targetAction = this.loadedActions.get(stateName);
    if (!targetAction) {
      console.error(`无法获取动画动作: ${stateName}`);
      return;
    }

    // 设置循环模式
    if (stateConfig.loop) {
      targetAction.setLoop(THREE.LoopRepeat, Infinity);
    } else {
      targetAction.setLoop(THREE.LoopOnce, 1);
    }
    targetAction.clampWhenFinished = !stateConfig.loop;

    // 执行动画过渡
    if (currentlyPlayingAction && currentlyPlayingAction !== targetAction) {
      // 根据动画类型动态计算过渡时间
      let fadeDuration = 0.3;
      if ((this.previousState?.name === 'thinking' && stateName === 'idle') ||
          (this.previousState?.name === 'idle' && stateName === 'thinking')) {
        fadeDuration = 0.5;
      } else if (stateConfig.loop !== this.previousState?.loop) {
        // 如果循环状态改变，延长过渡时间
        fadeDuration = 0.7;
      }
      
      // 启用动画混合
      currentlyPlayingAction.enabled = true;
      targetAction.enabled = true;
      
      // 重置目标动作的时间
      targetAction.time = 0;
      
      // 执行平滑交叉淡入淡出
      currentlyPlayingAction.crossFadeTo(targetAction, fadeDuration, true);
      targetAction.play();
      
      // 等待过渡完成
      await new Promise(resolve => setTimeout(resolve, fadeDuration * 1000));
    } else {
      // 重置目标动作的时间并播放
      targetAction.time = 0;
      targetAction.play();
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // 停止所有其他动作
    if (this.mixer) {
      for (let i = 0; i < this.mixer._actions.length; i++) {
        if (this.mixer._actions[i] !== targetAction) {
          this.mixer._actions[i].stop();
        }
      }
    }
    
    // 设置动画权重
    targetAction.setEffectiveWeight(1.0);
    targetAction.setEffectiveTimeScale(1.0);
  }

  // 加载动画
  loadAnimation(stateName, animationName) {
    return new Promise((resolve, reject) => {
      const animationConfig = ANIMATION_CONFIG[animationName];
      if (!animationConfig) {
        reject(new Error(`动画配置 "${animationName}" 不存在`));
        return;
      }

      // 获取状态配置
      const stateConfig = this.states.get(stateName);
      if (!stateConfig) {
        reject(new Error(`状态配置 "${stateName}" 不存在`));
        return;
      }

      const loader = new FBXLoader();
      loader.load(animationConfig.resource, (object) => {
        if (object.animations && object.animations.length > 0) {
          const action = this.mixer.clipAction(object.animations[0]);
          
          // 设置动画混合权重和时间
          action.setEffectiveWeight(1.0);
          action.setEffectiveTimeScale(1.0);
          action.time = 0; // 重置动画时间
          
          // 配置动画混合
          action.enabled = true;
          action.setLoop(stateConfig.loop ? THREE.LoopRepeat : THREE.LoopOnce, 1);
          action.clampWhenFinished = !stateConfig.loop;
          
          this.loadedActions.set(stateName, action);
          console.log(`动画 "${animationName}" 加载完成`);
          resolve(action);
        } else {
          reject(new Error(`动画文件中未找到动画剪辑: ${animationConfig.resource}`));
        }
      }, undefined, (error) => {
        console.error('加载动画时出错:', animationName, error);
        reject(error);
      });
    });
  }

  // 预加载动画
  async preloadAnimations() {
    const animationsToLoad = [];
    for (const [stateName, stateConfig] of this.states.entries()) {
      if (!this.loadedActions.has(stateName)) {
        animationsToLoad.push(this.loadAnimation(stateName, stateConfig.animation));
      }
    }
    
    try {
      await Promise.all(animationsToLoad);
      console.log('所有动画预加载完成');
    } catch (error) {
      console.error('动画预加载失败:', error);
    }
  }

  // 获取当前状态
  getCurrentState() {
    return this.currentState;
  }

  // 获取上一个状态
  getPreviousState() {
    return this.previousState;
  }
}