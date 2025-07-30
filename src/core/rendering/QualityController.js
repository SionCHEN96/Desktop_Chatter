/**
 * 自适应质量控制系统
 * 根据设备性能自动调整渲染质量
 */

import { PERFORMANCE_CONFIG } from '../../config/renderConfig.js';

export class QualityController {
  constructor(renderer, postProcessing) {
    this.renderer = renderer;
    this.postProcessing = postProcessing;
    
    // 性能监控
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.currentFPS = 60;
    this.targetFPS = PERFORMANCE_CONFIG.targetFPS;
    this.fpsHistory = [];
    this.maxHistoryLength = 60; // 保存60帧的历史
    
    // 质量等级
    this.currentQuality = PERFORMANCE_CONFIG.quality;
    this.qualityLevels = PERFORMANCE_CONFIG.qualityLevels;
    this.qualityOrder = ['low', 'medium', 'high', 'ultra'];
    
    // 自适应设置
    this.adaptiveEnabled = PERFORMANCE_CONFIG.adaptiveQuality;
    this.adjustmentCooldown = 2000; // 2秒冷却时间
    this.lastAdjustment = 0;
    
    // 设备性能检测
    this.deviceCapabilities = this.detectDeviceCapabilities();
    
    // 初始化质量设置
    this.applyQualitySettings(this.currentQuality);
  }

  /**
   * 检测设备性能能力
   */
  detectDeviceCapabilities() {
    const gl = this.renderer.getContext();
    const capabilities = {
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      isWebGL2: this.renderer.capabilities.isWebGL2,
      devicePixelRatio: window.devicePixelRatio,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      memory: navigator.deviceMemory || 4
    };
    
    // 计算性能评分
    let score = 0;
    
    // 纹理大小评分
    if (capabilities.maxTextureSize >= 16384) score += 30;
    else if (capabilities.maxTextureSize >= 8192) score += 20;
    else if (capabilities.maxTextureSize >= 4096) score += 10;
    
    // WebGL版本评分
    if (capabilities.isWebGL2) score += 20;
    else score += 10;
    
    // 设备内存评分
    if (capabilities.memory >= 8) score += 25;
    else if (capabilities.memory >= 4) score += 15;
    else score += 5;
    
    // CPU核心数评分
    if (capabilities.hardwareConcurrency >= 8) score += 15;
    else if (capabilities.hardwareConcurrency >= 4) score += 10;
    else score += 5;
    
    // 像素比评分
    if (capabilities.devicePixelRatio <= 1) score += 10;
    else if (capabilities.devicePixelRatio <= 2) score += 5;
    
    capabilities.performanceScore = score;
    
    console.log('Device capabilities detected:', capabilities);
    
    return capabilities;
  }

  /**
   * 根据设备能力推荐质量等级
   */
  getRecommendedQuality() {
    const score = this.deviceCapabilities.performanceScore;
    
    if (score >= 80) return 'ultra';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * 应用质量设置
   */
  applyQualitySettings(quality) {
    const settings = this.qualityLevels[quality];
    if (!settings) {
      console.warn(`Unknown quality level: ${quality}`);
      return;
    }
    
    console.log(`Applying quality settings: ${quality}`, settings);
    
    // 设置像素比率
    this.renderer.setPixelRatio(settings.pixelRatio);
    
    // 设置阴影贴图大小
    if (this.renderer.shadowMap.enabled) {
      // 更新所有光源的阴影贴图大小
      this.updateShadowMapSize(settings.shadowMapSize);
    }
    
    // 设置抗锯齿
    if (this.postProcessing) {
      if (settings.antialias) {
        this.postProcessing.setAntiAliasingMethod('fxaa');
      } else {
        this.postProcessing.setAntiAliasingMethod('none');
      }
      
      // 设置后处理效果
      this.postProcessing.toggleEffect('ssao', settings.postProcessing);
      this.postProcessing.toggleEffect('bloom', settings.postProcessing);
    }
    
    this.currentQuality = quality;
  }

  /**
   * 更新阴影贴图大小
   */
  updateShadowMapSize(size) {
    // 这个方法需要访问场景中的光源
    // 在实际使用中，需要从外部传入场景引用
    console.log(`Shadow map size updated to: ${size}`);
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
      
      // 添加到历史记录
      this.fpsHistory.push(this.currentFPS);
      if (this.fpsHistory.length > this.maxHistoryLength) {
        this.fpsHistory.shift();
      }
      
      // 自适应质量调整
      if (this.adaptiveEnabled) {
        this.adaptQuality();
      }
    }
  }

  /**
   * 自适应质量调整
   */
  adaptQuality() {
    const now = performance.now();
    
    // 检查冷却时间
    if (now - this.lastAdjustment < this.adjustmentCooldown) {
      return;
    }
    
    // 计算平均FPS
    const avgFPS = this.getAverageFPS();
    const currentIndex = this.qualityOrder.indexOf(this.currentQuality);
    
    // 如果FPS过低，降低质量
    if (avgFPS < this.targetFPS * 0.8 && currentIndex > 0) {
      const newQuality = this.qualityOrder[currentIndex - 1];
      console.log(`Performance too low (${avgFPS.toFixed(1)} FPS), reducing quality to: ${newQuality}`);
      this.applyQualitySettings(newQuality);
      this.lastAdjustment = now;
    }
    // 如果FPS很高，提高质量
    else if (avgFPS > this.targetFPS * 1.2 && currentIndex < this.qualityOrder.length - 1) {
      const newQuality = this.qualityOrder[currentIndex + 1];
      console.log(`Performance good (${avgFPS.toFixed(1)} FPS), increasing quality to: ${newQuality}`);
      this.applyQualitySettings(newQuality);
      this.lastAdjustment = now;
    }
  }

  /**
   * 计算平均FPS
   */
  getAverageFPS() {
    if (this.fpsHistory.length === 0) return this.currentFPS;
    
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return sum / this.fpsHistory.length;
  }

  /**
   * 手动设置质量等级
   */
  setQuality(quality) {
    if (!this.qualityLevels[quality]) {
      console.warn(`Unknown quality level: ${quality}`);
      return false;
    }
    
    this.applyQualitySettings(quality);
    return true;
  }

  /**
   * 启用/禁用自适应质量
   */
  setAdaptiveQuality(enabled) {
    this.adaptiveEnabled = enabled;
    console.log(`Adaptive quality ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    return {
      currentFPS: this.currentFPS,
      averageFPS: this.getAverageFPS(),
      targetFPS: this.targetFPS,
      currentQuality: this.currentQuality,
      adaptiveEnabled: this.adaptiveEnabled,
      deviceScore: this.deviceCapabilities.performanceScore,
      recommendedQuality: this.getRecommendedQuality()
    };
  }

  /**
   * 获取可用的质量等级
   */
  getAvailableQualities() {
    return this.qualityOrder;
  }

  /**
   * 获取当前质量等级
   */
  getCurrentQuality() {
    return this.currentQuality;
  }

  /**
   * 重置性能历史
   */
  resetPerformanceHistory() {
    this.fpsHistory = [];
    this.frameCount = 0;
    this.lastTime = performance.now();
  }

  /**
   * 设置目标FPS
   */
  setTargetFPS(fps) {
    this.targetFPS = fps;
    console.log(`Target FPS set to: ${fps}`);
  }

  /**
   * 获取质量设置详情
   */
  getQualitySettings(quality = this.currentQuality) {
    return this.qualityLevels[quality];
  }
}
