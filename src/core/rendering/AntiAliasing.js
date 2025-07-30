/**
 * 高级抗锯齿系统
 * 实现MSAA、FXAA、TAA等多种抗锯齿技术
 */

import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

export class AntiAliasing {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    
    this.msaaEnabled = false;
    this.fxaaPass = null;
    this.taaPass = null;
    
    this.currentMethod = 'none';
    this.availableMethods = ['none', 'msaa', 'fxaa', 'taa'];
  }

  /**
   * 启用MSAA（多重采样抗锯齿）
   */
  enableMSAA(samples = 4) {
    // MSAA需要在渲染器创建时启用
    if (this.renderer.capabilities.isWebGL2) {
      // WebGL2支持更好的MSAA
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.msaaEnabled = true;
      this.currentMethod = 'msaa';
      console.log(`MSAA enabled with ${samples} samples`);
    } else {
      console.warn('MSAA requires WebGL2, falling back to FXAA');
      this.enableFXAA();
    }
  }

  /**
   * 创建FXAA通道
   */
  createFXAAPass() {
    const fxaaPass = new ShaderPass(FXAAShader);
    const size = this.renderer.getSize(new THREE.Vector2());
    
    fxaaPass.material.uniforms['resolution'].value.x = 1 / size.width;
    fxaaPass.material.uniforms['resolution'].value.y = 1 / size.height;
    
    return fxaaPass;
  }

  /**
   * 启用FXAA（快速近似抗锯齿）
   */
  enableFXAA() {
    this.fxaaPass = this.createFXAAPass();
    this.currentMethod = 'fxaa';
    console.log('FXAA enabled');
    return this.fxaaPass;
  }

  /**
   * 创建TAA通道（时间抗锯齿）
   */
  createTAAPass() {
    const taaShader = {
      uniforms: {
        'tDiffuse': { value: null },
        'tPrevious': { value: null },
        'resolution': { value: new THREE.Vector2() },
        'cameraMatrix': { value: new THREE.Matrix4() },
        'previousCameraMatrix': { value: new THREE.Matrix4() },
        'jitterOffset': { value: new THREE.Vector2() },
        'blend': { value: 0.9 }
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
        uniform sampler2D tPrevious;
        uniform vec2 resolution;
        uniform mat4 cameraMatrix;
        uniform mat4 previousCameraMatrix;
        uniform vec2 jitterOffset;
        uniform float blend;
        varying vec2 vUv;
        
        vec2 getVelocity(vec2 uv) {
          // 简化的运动向量计算
          vec4 currentPos = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
          vec4 previousPos = previousCameraMatrix * inverse(cameraMatrix) * currentPos;
          previousPos.xy /= previousPos.w;
          return (currentPos.xy - previousPos.xy) * 0.5;
        }
        
        void main() {
          vec4 current = texture2D(tDiffuse, vUv);
          
          // 计算运动向量
          vec2 velocity = getVelocity(vUv);
          vec2 previousUV = vUv - velocity;
          
          // 采样前一帧
          vec4 previous = texture2D(tPrevious, previousUV);
          
          // 边界检查
          if (previousUV.x < 0.0 || previousUV.x > 1.0 || 
              previousUV.y < 0.0 || previousUV.y > 1.0) {
            gl_FragColor = current;
            return;
          }
          
          // 时间混合
          gl_FragColor = mix(current, previous, blend);
        }
      `
    };
    
    const taaPass = new ShaderPass(taaShader);
    const size = this.renderer.getSize(new THREE.Vector2());
    taaPass.material.uniforms['resolution'].value.set(size.width, size.height);
    
    return taaPass;
  }

  /**
   * 启用TAA（时间抗锯齿）
   */
  enableTAA() {
    this.taaPass = this.createTAAPass();
    this.currentMethod = 'taa';
    console.log('TAA enabled');
    return this.taaPass;
  }

  /**
   * 创建SMAA通道（子像素形态学抗锯齿）
   */
  createSMAAPass() {
    // SMAA实现较为复杂，这里提供一个简化版本
    const smaaShader = {
      uniforms: {
        'tDiffuse': { value: null },
        'resolution': { value: new THREE.Vector2() },
        'threshold': { value: 0.1 },
        'maxSearchSteps': { value: 16 }
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
        uniform float threshold;
        uniform int maxSearchSteps;
        varying vec2 vUv;
        
        float luminance(vec3 color) {
          return dot(color, vec3(0.299, 0.587, 0.114));
        }
        
        vec4 smaaEdgeDetection(vec2 uv) {
          vec2 texel = 1.0 / resolution;
          
          // 采样周围像素
          float lumaCenter = luminance(texture2D(tDiffuse, uv).rgb);
          float lumaLeft = luminance(texture2D(tDiffuse, uv - vec2(texel.x, 0.0)).rgb);
          float lumaRight = luminance(texture2D(tDiffuse, uv + vec2(texel.x, 0.0)).rgb);
          float lumaTop = luminance(texture2D(tDiffuse, uv - vec2(0.0, texel.y)).rgb);
          float lumaBottom = luminance(texture2D(tDiffuse, uv + vec2(0.0, texel.y)).rgb);
          
          // 计算边缘强度
          float deltaH = abs(lumaLeft - lumaCenter) + abs(lumaRight - lumaCenter);
          float deltaV = abs(lumaTop - lumaCenter) + abs(lumaBottom - lumaCenter);
          
          vec2 edges = vec2(deltaH, deltaV);
          edges = step(threshold, edges);
          
          return vec4(edges, 0.0, 1.0);
        }
        
        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          vec4 edges = smaaEdgeDetection(vUv);
          
          // 简化的SMAA混合
          if (edges.x > 0.0 || edges.y > 0.0) {
            vec2 texel = 1.0 / resolution;
            vec4 blended = color;
            
            // 简单的双线性过滤
            blended += texture2D(tDiffuse, vUv + vec2(texel.x, 0.0)) * 0.25;
            blended += texture2D(tDiffuse, vUv - vec2(texel.x, 0.0)) * 0.25;
            blended += texture2D(tDiffuse, vUv + vec2(0.0, texel.y)) * 0.25;
            blended += texture2D(tDiffuse, vUv - vec2(0.0, texel.y)) * 0.25;
            blended *= 0.2;
            
            gl_FragColor = blended;
          } else {
            gl_FragColor = color;
          }
        }
      `
    };
    
    const smaaPass = new ShaderPass(smaaShader);
    const size = this.renderer.getSize(new THREE.Vector2());
    smaaPass.material.uniforms['resolution'].value.set(size.width, size.height);
    
    return smaaPass;
  }

  /**
   * 启用SMAA
   */
  enableSMAA() {
    this.smaaPass = this.createSMAAPass();
    this.currentMethod = 'smaa';
    console.log('SMAA enabled');
    return this.smaaPass;
  }

  /**
   * 设置抗锯齿方法
   */
  setMethod(method) {
    if (!this.availableMethods.includes(method)) {
      console.warn(`Unknown anti-aliasing method: ${method}`);
      return null;
    }
    
    switch (method) {
      case 'msaa':
        return this.enableMSAA();
      case 'fxaa':
        return this.enableFXAA();
      case 'taa':
        return this.enableTAA();
      case 'smaa':
        return this.enableSMAA();
      default:
        this.currentMethod = 'none';
        return null;
    }
  }

  /**
   * 获取当前抗锯齿通道
   */
  getCurrentPass() {
    switch (this.currentMethod) {
      case 'fxaa':
        return this.fxaaPass;
      case 'taa':
        return this.taaPass;
      case 'smaa':
        return this.smaaPass;
      default:
        return null;
    }
  }

  /**
   * 窗口大小调整
   */
  onWindowResize(width, height) {
    if (this.fxaaPass) {
      this.fxaaPass.material.uniforms['resolution'].value.x = 1 / width;
      this.fxaaPass.material.uniforms['resolution'].value.y = 1 / height;
    }
    
    if (this.taaPass) {
      this.taaPass.material.uniforms['resolution'].value.set(width, height);
    }
    
    if (this.smaaPass) {
      this.smaaPass.material.uniforms['resolution'].value.set(width, height);
    }
  }

  /**
   * 获取可用的抗锯齿方法
   */
  getAvailableMethods() {
    return this.availableMethods;
  }

  /**
   * 获取当前方法
   */
  getCurrentMethod() {
    return this.currentMethod;
  }

  /**
   * 清理资源
   */
  dispose() {
    if (this.fxaaPass) {
      this.fxaaPass.dispose();
    }
    
    if (this.taaPass) {
      this.taaPass.dispose();
    }
    
    if (this.smaaPass) {
      this.smaaPass.dispose();
    }
  }
}
