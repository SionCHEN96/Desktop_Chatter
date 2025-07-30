/**
 * 环境贴图加载器
 * 提供高质量的IBL（基于图像的光照）环境贴图
 */

import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

export class EnvironmentLoader {
  constructor(renderer) {
    this.renderer = renderer;
    this.pmremGenerator = new THREE.PMREMGenerator(renderer);
    this.pmremGenerator.compileEquirectangularShader();
    
    this.envMaps = new Map(); // 缓存环境贴图
    this.currentEnvMap = null;
  }

  /**
   * 创建程序化环境贴图
   */
  createProceduralEnvironment(type = 'studio') {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    
    switch (type) {
      case 'studio':
        this.createStudioEnvironment(context, size);
        break;
      case 'outdoor':
        this.createOutdoorEnvironment(context, size);
        break;
      case 'sunset':
        this.createSunsetEnvironment(context, size);
        break;
      default:
        this.createStudioEnvironment(context, size);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    
    const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
    texture.dispose();
    
    this.envMaps.set(type, envMap);
    return envMap;
  }

  /**
   * 创建工作室环境
   */
  createStudioEnvironment(context, size) {
    // 创建工作室风格的环境贴图
    const gradient = context.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, '#ffffff');    // 顶部白色
    gradient.addColorStop(0.3, '#f0f0f0');  // 上部浅灰
    gradient.addColorStop(0.7, '#e0e0e0');  // 中部灰色
    gradient.addColorStop(1, '#d0d0d0');    // 底部深灰
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    
    // 添加一些高光区域模拟工作室灯光
    this.addStudioLights(context, size);
  }

  /**
   * 添加工作室灯光效果
   */
  addStudioLights(context, size) {
    // 主光源
    const mainLight = context.createRadialGradient(
      size * 0.3, size * 0.2, 0,
      size * 0.3, size * 0.2, size * 0.15
    );
    mainLight.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    mainLight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    context.fillStyle = mainLight;
    context.fillRect(0, 0, size, size);
    
    // 填充光
    const fillLight = context.createRadialGradient(
      size * 0.7, size * 0.3, 0,
      size * 0.7, size * 0.3, size * 0.1
    );
    fillLight.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    fillLight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    context.fillStyle = fillLight;
    context.fillRect(0, 0, size, size);
    
    // 轮廓光
    const rimLight = context.createRadialGradient(
      size * 0.5, size * 0.8, 0,
      size * 0.5, size * 0.8, size * 0.08
    );
    rimLight.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    rimLight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    context.fillStyle = rimLight;
    context.fillRect(0, 0, size, size);
  }

  /**
   * 创建户外环境
   */
  createOutdoorEnvironment(context, size) {
    // 天空渐变
    const skyGradient = context.createLinearGradient(0, 0, 0, size);
    skyGradient.addColorStop(0, '#87CEEB');   // 天蓝色
    skyGradient.addColorStop(0.4, '#98D8E8'); // 浅蓝色
    skyGradient.addColorStop(0.7, '#F0F8FF'); // 接近白色
    skyGradient.addColorStop(1, '#90EE90');   // 浅绿色（地面）
    
    context.fillStyle = skyGradient;
    context.fillRect(0, 0, size, size);
    
    // 添加太阳
    const sun = context.createRadialGradient(
      size * 0.8, size * 0.2, 0,
      size * 0.8, size * 0.2, size * 0.1
    );
    sun.addColorStop(0, 'rgba(255, 255, 200, 1)');
    sun.addColorStop(1, 'rgba(255, 255, 200, 0)');
    
    context.fillStyle = sun;
    context.fillRect(0, 0, size, size);
  }

  /**
   * 创建日落环境
   */
  createSunsetEnvironment(context, size) {
    // 日落渐变
    const sunsetGradient = context.createLinearGradient(0, 0, 0, size);
    sunsetGradient.addColorStop(0, '#FF6B35');   // 橙红色
    sunsetGradient.addColorStop(0.3, '#F7931E'); // 橙色
    sunsetGradient.addColorStop(0.6, '#FFD23F'); // 黄色
    sunsetGradient.addColorStop(0.8, '#FFF1E6'); // 浅黄色
    sunsetGradient.addColorStop(1, '#2C1810');   // 深棕色（地面）
    
    context.fillStyle = sunsetGradient;
    context.fillRect(0, 0, size, size);
    
    // 添加太阳
    const sun = context.createRadialGradient(
      size * 0.2, size * 0.7, 0,
      size * 0.2, size * 0.7, size * 0.15
    );
    sun.addColorStop(0, 'rgba(255, 200, 100, 1)');
    sun.addColorStop(1, 'rgba(255, 200, 100, 0)');
    
    context.fillStyle = sun;
    context.fillRect(0, 0, size, size);
  }

  /**
   * 加载HDR环境贴图
   */
  async loadHDREnvironment(url) {
    return new Promise((resolve, reject) => {
      const loader = new RGBELoader();
      loader.load(url, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
        texture.dispose();
        
        this.envMaps.set(url, envMap);
        resolve(envMap);
      }, undefined, reject);
    });
  }

  /**
   * 加载EXR环境贴图
   */
  async loadEXREnvironment(url) {
    return new Promise((resolve, reject) => {
      const loader = new EXRLoader();
      loader.load(url, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
        texture.dispose();
        
        this.envMaps.set(url, envMap);
        resolve(envMap);
      }, undefined, reject);
    });
  }

  /**
   * 获取环境贴图
   */
  getEnvironment(name) {
    if (this.envMaps.has(name)) {
      return this.envMaps.get(name);
    }
    
    // 如果没有找到，创建默认的工作室环境
    return this.createProceduralEnvironment('studio');
  }

  /**
   * 设置当前环境
   */
  setCurrentEnvironment(envMap) {
    this.currentEnvMap = envMap;
    return envMap;
  }

  /**
   * 获取当前环境
   */
  getCurrentEnvironment() {
    return this.currentEnvMap;
  }

  /**
   * 预加载常用环境
   */
  preloadCommonEnvironments() {
    this.createProceduralEnvironment('studio');
    this.createProceduralEnvironment('outdoor');
    this.createProceduralEnvironment('sunset');
  }

  /**
   * 清理资源
   */
  dispose() {
    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
    }
    
    // 清理所有环境贴图
    this.envMaps.forEach(envMap => {
      if (envMap.dispose) {
        envMap.dispose();
      }
    });
    
    this.envMaps.clear();
  }
}
