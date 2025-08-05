/**
 * 后处理效果系统
 * 实现SSAO、Bloom、FXAA等高质量后处理效果
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { AntiAliasing } from './AntiAliasing.js';
import { RENDERING_CONFIG } from '../../config/index.js';

// 使用默认的后处理配置
const POST_PROCESSING_CONFIG = {
  ssao: {
    enabled: true,
    kernelRadius: 8,
    minDistance: 0.005,
    maxDistance: 0.1,
    intensity: 1.0,
    bias: 0.01,
    scale: 1.0,
    kernelSize: 32
  },
  bloom: {
    enabled: true,
    threshold: 0.85,
    strength: 0.35,
    radius: 0.8
  },
  fxaa: { enabled: true }
};

export class PostProcessing {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.composer = null;
    this.passes = {};
    this.antiAliasing = null;

    this.init();
  }

  /**
   * 初始化后处理管道
   */
  init() {
    const size = this.renderer.getSize(new THREE.Vector2());
    
    // 创建效果合成器
    this.composer = new EffectComposer(this.renderer);

    // 初始化抗锯齿系统
    this.antiAliasing = new AntiAliasing(this.renderer, this.scene, this.camera);

    // 基础渲染通道
    this.addRenderPass();

    // SSAO通道
    if (POST_PROCESSING_CONFIG.ssao.enabled) {
      this.addSSAOPass();
    }

    // Bloom通道
    if (POST_PROCESSING_CONFIG.bloom.enabled) {
      this.addBloomPass();
    }

    // 抗锯齿通道
    if (POST_PROCESSING_CONFIG.fxaa.enabled) {
      this.addAntiAliasingPass();
    }

    // 输出通道
    this.addOutputPass();
  }

  /**
   * 添加基础渲染通道
   */
  addRenderPass() {
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    this.passes.render = renderPass;
  }

  /**
   * 添加SSAO通道
   */
  addSSAOPass() {
    const size = this.renderer.getSize(new THREE.Vector2());
    const ssaoPass = new SSAOPass(this.scene, this.camera, size.width, size.height);
    
    // 配置SSAO参数
    const config = POST_PROCESSING_CONFIG.ssao;
    ssaoPass.kernelRadius = config.kernelRadius;
    ssaoPass.minDistance = config.minDistance;
    ssaoPass.maxDistance = config.maxDistance;
    ssaoPass.intensity = config.intensity;
    ssaoPass.bias = config.bias;
    ssaoPass.scale = config.scale;
    ssaoPass.kernelSize = config.kernelSize;
    
    this.composer.addPass(ssaoPass);
    this.passes.ssao = ssaoPass;
  }

  /**
   * 添加Bloom通道
   */
  addBloomPass() {
    const size = this.renderer.getSize(new THREE.Vector2());
    const config = POST_PROCESSING_CONFIG.bloom;
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      config.strength,
      config.radius,
      config.threshold
    );
    
    bloomPass.threshold = config.threshold;
    bloomPass.strength = config.strength;
    bloomPass.radius = config.radius;
    
    this.composer.addPass(bloomPass);
    this.passes.bloom = bloomPass;
  }

  /**
   * 添加抗锯齿通道
   */
  addAntiAliasingPass() {
    const aaPass = this.antiAliasing.setMethod('fxaa');
    if (aaPass) {
      this.composer.addPass(aaPass);
      this.passes.antialiasing = aaPass;
    }
  }

  /**
   * 添加输出通道
   */
  addOutputPass() {
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
    this.passes.output = outputPass;
  }

  /**
   * 添加自定义色调映射通道
   */
  addToneMappingPass() {
    const toneMappingShader = {
      uniforms: {
        'tDiffuse': { value: null },
        'exposure': { value: POST_PROCESSING_CONFIG.toneMapping.exposure },
        'whitePoint': { value: POST_PROCESSING_CONFIG.toneMapping.whitePoint }
      },
      
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float exposure;
        uniform float whitePoint;
        varying vec2 vUv;
        
        // ACES色调映射
        vec3 ACESFilm(vec3 x) {
          float a = 2.51;
          float b = 0.03;
          float c = 2.43;
          float d = 0.59;
          float e = 0.14;
          return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
        }
        
        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          
          // 应用曝光
          color.rgb *= exposure;
          
          // ACES色调映射
          color.rgb = ACESFilm(color.rgb);
          
          gl_FragColor = color;
        }
      `
    };
    
    const toneMappingPass = new ShaderPass(toneMappingShader);
    this.composer.addPass(toneMappingPass);
    this.passes.toneMapping = toneMappingPass;
  }

  /**
   * 添加锐化通道
   */
  addSharpenPass() {
    const sharpenShader = {
      uniforms: {
        'tDiffuse': { value: null },
        'resolution': { value: new THREE.Vector2() },
        'amount': { value: 0.5 }
      },
      
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        uniform float amount;
        varying vec2 vUv;
        
        void main() {
          vec2 texel = 1.0 / resolution;
          
          vec4 center = texture2D(tDiffuse, vUv);
          vec4 top = texture2D(tDiffuse, vUv + vec2(0.0, texel.y));
          vec4 bottom = texture2D(tDiffuse, vUv - vec2(0.0, texel.y));
          vec4 left = texture2D(tDiffuse, vUv - vec2(texel.x, 0.0));
          vec4 right = texture2D(tDiffuse, vUv + vec2(texel.x, 0.0));
          
          vec4 sharp = center * 5.0 - (top + bottom + left + right);
          
          gl_FragColor = mix(center, sharp, amount);
        }
      `
    };
    
    const sharpenPass = new ShaderPass(sharpenShader);
    const size = this.renderer.getSize(new THREE.Vector2());
    sharpenPass.material.uniforms['resolution'].value.set(size.width, size.height);
    
    this.composer.addPass(sharpenPass);
    this.passes.sharpen = sharpenPass;
  }

  /**
   * 渲染后处理效果
   */
  render() {
    this.composer.render();
  }

  /**
   * 设置SSAO参数
   */
  setSSAOParams(params) {
    if (this.passes.ssao) {
      Object.assign(this.passes.ssao, params);
    }
  }

  /**
   * 设置Bloom参数
   */
  setBloomParams(params) {
    if (this.passes.bloom) {
      Object.assign(this.passes.bloom, params);
    }
  }

  /**
   * 启用/禁用特定效果
   */
  toggleEffect(effectName, enabled) {
    if (this.passes[effectName]) {
      this.passes[effectName].enabled = enabled;
    }
  }

  /**
   * 设置抗锯齿方法
   */
  setAntiAliasingMethod(method) {
    // 移除现有的抗锯齿通道
    if (this.passes.antialiasing) {
      const index = this.composer.passes.indexOf(this.passes.antialiasing);
      if (index > -1) {
        this.composer.passes.splice(index, 1);
      }
    }

    // 添加新的抗锯齿通道
    const aaPass = this.antiAliasing.setMethod(method);
    if (aaPass) {
      // 在输出通道之前插入抗锯齿通道
      const outputIndex = this.composer.passes.findIndex(pass => pass.constructor.name === 'OutputPass');
      if (outputIndex > -1) {
        this.composer.passes.splice(outputIndex, 0, aaPass);
      } else {
        this.composer.addPass(aaPass);
      }
      this.passes.antialiasing = aaPass;
    }
  }

  /**
   * 窗口大小调整
   */
  onWindowResize(width, height) {
    this.composer.setSize(width, height);

    // 更新抗锯齿
    if (this.antiAliasing) {
      this.antiAliasing.onWindowResize(width, height);
    }

    // 更新锐化分辨率
    if (this.passes.sharpen) {
      this.passes.sharpen.material.uniforms['resolution'].value.set(width, height);
    }

    // 更新SSAO
    if (this.passes.ssao) {
      this.passes.ssao.setSize(width, height);
    }
  }

  /**
   * 获取合成器
   */
  getComposer() {
    return this.composer;
  }

  /**
   * 清理资源
   */
  dispose() {
    if (this.composer) {
      this.composer.dispose();
    }

    if (this.antiAliasing) {
      this.antiAliasing.dispose();
    }

    // 清理各个通道
    Object.values(this.passes).forEach(pass => {
      if (pass.dispose) {
        pass.dispose();
      }
    });
  }
}
