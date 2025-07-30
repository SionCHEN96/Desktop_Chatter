/**
 * 高质量3D渲染器
 * 实现接近Windows 3D Viewer质量的渲染效果
 */

import * as THREE from 'three';
import { PostProcessing } from './PostProcessing.js';
import { EnvironmentLoader } from './EnvironmentLoader.js';
import { QualityController } from './QualityController.js';
import {
  RENDERER_CONFIG,
  PBR_MATERIAL_CONFIG,
  LIGHTING_CONFIG,
  POST_PROCESSING_CONFIG,
  CAMERA_CONFIG,
  PERFORMANCE_CONFIG,
  ENVIRONMENT_CONFIG
} from '../../config/renderConfig.js';

export class HighQualityRenderer {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.postProcessing = null; // 后处理系统
    this.environmentLoader = null; // 环境加载器
    this.qualityController = null; // 质量控制器
    this.envMap = null;
    
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
    this.setupPostProcessing();
    this.setupQualityController();
  }

  /**
   * 创建场景
   */
  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = null; // 透明背景
    
    // 设置雾效（可选）
    // this.scene.fog = new THREE.Fog(0x000000, 10, 50);
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
    this.renderer.setPixelRatio(RENDERER_CONFIG.pixelRatio);
    
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
    this.environmentLoader = new EnvironmentLoader(this.renderer);

    // 预加载常用环境
    this.environmentLoader.preloadCommonEnvironments();

    // 设置默认环境
    this.envMap = this.environmentLoader.getEnvironment('studio');
    this.scene.environment = this.envMap;
    this.environmentLoader.setCurrentEnvironment(this.envMap);
  }

  /**
   * 设置后处理
   */
  setupPostProcessing() {
    this.postProcessing = new PostProcessing(this.renderer, this.scene, this.camera);
  }

  /**
   * 设置质量控制器
   */
  setupQualityController() {
    this.qualityController = new QualityController(this.renderer, this.postProcessing);

    // 根据设备能力设置初始质量
    const recommendedQuality = this.qualityController.getRecommendedQuality();
    console.log(`Recommended quality level: ${recommendedQuality}`);
    this.qualityController.setQuality(recommendedQuality);
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
    // 更新质量控制器
    if (this.qualityController) {
      this.qualityController.updatePerformance();
    }

    if (this.postProcessing) {
      this.postProcessing.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * 设置渲染质量
   */
  setQuality(quality) {
    if (this.qualityController) {
      return this.qualityController.setQuality(quality);
    }
    return false;
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    if (this.qualityController) {
      return this.qualityController.getPerformanceStats();
    }
    return null;
  }

  /**
   * 启用/禁用自适应质量
   */
  setAdaptiveQuality(enabled) {
    if (this.qualityController) {
      this.qualityController.setAdaptiveQuality(enabled);
    }
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

    if (this.postProcessing) {
      this.postProcessing.onWindowResize(width, height);
    }
  }

  /**
   * 切换环境
   */
  setEnvironment(environmentName) {
    const newEnvMap = this.environmentLoader.getEnvironment(environmentName);
    if (newEnvMap) {
      this.envMap = newEnvMap;
      this.scene.environment = this.envMap;
      this.environmentLoader.setCurrentEnvironment(this.envMap);

      // 更新所有材质的环境贴图
      this.scene.traverse((child) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              if (mat.envMap !== undefined) {
                mat.envMap = this.envMap;
                mat.needsUpdate = true;
              }
            });
          } else {
            if (child.material.envMap !== undefined) {
              child.material.envMap = this.envMap;
              child.material.needsUpdate = true;
            }
          }
        }
      });
    }
  }

  /**
   * 清理资源
   */
  dispose() {
    if (this.environmentLoader) {
      this.environmentLoader.dispose();
    }

    if (this.postProcessing) {
      this.postProcessing.dispose();
    }

    if (this.qualityController) {
      // 质量控制器不需要特殊清理
      this.qualityController = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
