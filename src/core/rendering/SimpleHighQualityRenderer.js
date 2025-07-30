/**
 * 简化的高质量3D渲染器
 * 专注于核心渲染质量提升，避免复杂的后处理依赖
 */

import * as THREE from 'three';
import { 
  RENDERER_CONFIG, 
  PBR_MATERIAL_CONFIG, 
  LIGHTING_CONFIG, 
  CAMERA_CONFIG,
  PERFORMANCE_CONFIG
} from '../../config/renderConfig.js';

export class SimpleHighQualityRenderer {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.pmremGenerator = null;
    this.envMap = null;
    
    // 性能监控
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.currentFPS = 60;
    
    this.init();
  }

  /**
   * 初始化渲染器
   */
  init() {
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.setupLighting();
    this.setupEnvironment();
  }

  /**
   * 创建场景
   */
  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = null; // 透明背景
  }

  /**
   * 创建相机
   */
  createCamera() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.fov,
      width / height,
      CAMERA_CONFIG.near,
      CAMERA_CONFIG.far
    );
    
    this.camera.position.set(...CAMERA_CONFIG.position);
    this.camera.lookAt(...CAMERA_CONFIG.target);
  }

  /**
   * 创建渲染器
   */
  createRenderer() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.renderer = new THREE.WebGLRenderer({
      antialias: RENDERER_CONFIG.antialias,
      powerPreference: RENDERER_CONFIG.powerPreference,
      alpha: RENDERER_CONFIG.alpha,
      stencil: RENDERER_CONFIG.stencil,
      depth: RENDERER_CONFIG.depth,
      logarithmicDepthBuffer: RENDERER_CONFIG.logarithmicDepthBuffer
    });
    
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // 色彩空间和色调映射
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = RENDERER_CONFIG.toneMappingExposure;
    
    // 阴影设置
    this.renderer.shadowMap.enabled = RENDERER_CONFIG.shadowMap.enabled;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // 其他高质量设置
    this.renderer.useLegacyLights = false;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setClearAlpha(0);
    
    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * 设置光照系统
   */
  setupLighting() {
    // 主方向光
    const directionalLight = new THREE.DirectionalLight(
      LIGHTING_CONFIG.directional.color,
      LIGHTING_CONFIG.directional.intensity
    );
    directionalLight.position.set(...LIGHTING_CONFIG.directional.position);
    directionalLight.castShadow = LIGHTING_CONFIG.directional.castShadow;
    
    // 配置阴影
    if (directionalLight.castShadow) {
      const shadowConfig = LIGHTING_CONFIG.directional.shadow;
      directionalLight.shadow.mapSize.width = shadowConfig.mapSize;
      directionalLight.shadow.mapSize.height = shadowConfig.mapSize;
      directionalLight.shadow.camera.near = shadowConfig.camera.near;
      directionalLight.shadow.camera.far = shadowConfig.camera.far;
      directionalLight.shadow.camera.left = shadowConfig.camera.left;
      directionalLight.shadow.camera.right = shadowConfig.camera.right;
      directionalLight.shadow.camera.top = shadowConfig.camera.top;
      directionalLight.shadow.camera.bottom = shadowConfig.camera.bottom;
      directionalLight.shadow.bias = shadowConfig.bias;
      directionalLight.shadow.normalBias = shadowConfig.normalBias;
    }
    
    this.scene.add(directionalLight);
    
    // 填充光
    const fillLight = new THREE.DirectionalLight(
      LIGHTING_CONFIG.fill.color,
      LIGHTING_CONFIG.fill.intensity
    );
    fillLight.position.set(...LIGHTING_CONFIG.fill.position);
    this.scene.add(fillLight);
    
    // 轮廓光
    const rimLight = new THREE.DirectionalLight(
      LIGHTING_CONFIG.rim.color,
      LIGHTING_CONFIG.rim.intensity
    );
    rimLight.position.set(...LIGHTING_CONFIG.rim.position);
    this.scene.add(rimLight);
    
    // 环境光
    const ambientLight = new THREE.AmbientLight(
      LIGHTING_CONFIG.ambient.color,
      LIGHTING_CONFIG.ambient.intensity
    );
    this.scene.add(ambientLight);
    
    // 半球光
    const hemisphereLight = new THREE.HemisphereLight(
      LIGHTING_CONFIG.hemisphere.skyColor,
      LIGHTING_CONFIG.hemisphere.groundColor,
      LIGHTING_CONFIG.hemisphere.intensity
    );
    this.scene.add(hemisphereLight);
  }

  /**
   * 设置环境映射
   */
  setupEnvironment() {
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
    
    // 创建默认环境贴图
    this.createDefaultEnvironment();
  }

  /**
   * 创建默认环境贴图
   */
  createDefaultEnvironment() {
    // 创建一个简单的渐变环境贴图
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    
    // 创建更暗的工作室风格渐变
    const gradient = context.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, '#e0e0e0');    // 顶部浅灰（降低亮度）
    gradient.addColorStop(0.3, '#c0c0c0');  // 上部中灰
    gradient.addColorStop(0.7, '#a0a0a0');  // 中部深灰
    gradient.addColorStop(1, '#808080');    // 底部更深灰
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    
    // 添加更柔和的高光区域模拟工作室灯光
    const mainLight = context.createRadialGradient(
      size * 0.3, size * 0.2, 0,
      size * 0.3, size * 0.2, size * 0.15
    );
    mainLight.addColorStop(0, 'rgba(255, 255, 255, 0.4)'); // 降低高光强度
    mainLight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    context.fillStyle = mainLight;
    context.fillRect(0, 0, size, size);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    
    this.envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
    this.scene.environment = this.envMap;
    
    texture.dispose();
  }

  /**
   * 优化材质为PBR
   */
  optimizeMaterial(material) {
    if (!material) return;
    
    // 如果不是PBR材质，创建新的PBR材质
    if (material.type !== 'MeshStandardMaterial') {
      const pbrMaterial = new THREE.MeshStandardMaterial();
      
      // 复制基础属性
      if (material.map) pbrMaterial.map = material.map;
      if (material.color) pbrMaterial.color = material.color;
      if (material.normalMap) pbrMaterial.normalMap = material.normalMap;
      
      // 设置PBR属性
      pbrMaterial.metalness = PBR_MATERIAL_CONFIG.metalness;
      pbrMaterial.roughness = PBR_MATERIAL_CONFIG.roughness;
      pbrMaterial.envMapIntensity = PBR_MATERIAL_CONFIG.envMapIntensity;
      
      // 设置环境贴图
      if (this.envMap) {
        pbrMaterial.envMap = this.envMap;
      }
      
      return pbrMaterial;
    }
    
    // 如果已经是PBR材质，优化属性
    material.metalness = PBR_MATERIAL_CONFIG.metalness;
    material.roughness = PBR_MATERIAL_CONFIG.roughness;
    material.envMapIntensity = PBR_MATERIAL_CONFIG.envMapIntensity;
    
    if (this.envMap) {
      material.envMap = this.envMap;
    }
    
    return material;
  }

  /**
   * 添加模型到场景
   */
  addModel(model) {
    // 遍历模型并优化材质
    model.traverse((child) => {
      if (child.isMesh) {
        // 优化材质
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material = child.material.map(mat => this.optimizeMaterial(mat));
          } else {
            child.material = this.optimizeMaterial(child.material);
          }
        }
        
        // 设置阴影
        child.castShadow = PBR_MATERIAL_CONFIG.castShadow;
        child.receiveShadow = PBR_MATERIAL_CONFIG.receiveShadow;
      }
    });
    
    this.scene.add(model);
  }

  /**
   * 渲染循环
   */
  render() {
    this.updatePerformance();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * 更新性能监控
   */
  updatePerformance() {
    this.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - this.lastTime >= 1000) {
      this.currentFPS = this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    return {
      currentFPS: this.currentFPS,
      targetFPS: PERFORMANCE_CONFIG.targetFPS
    };
  }

  /**
   * 窗口大小调整
   */
  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }

  /**
   * 清理资源
   */
  dispose() {
    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
    }
    
    if (this.envMap) {
      this.envMap.dispose();
    }
    
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
