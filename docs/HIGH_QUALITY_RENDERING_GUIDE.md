# 高质量3D渲染系统使用指南

## 概述

本系统实现了接近Windows 3D Viewer质量水平的3D渲染效果，包含以下主要特性：

- **PBR材质系统** - 物理基础渲染，更真实的材质表现
- **高级光照系统** - 多光源设置，IBL环境光照
- **后处理效果** - SSAO、Bloom、色调映射等
- **高级抗锯齿** - FXAA、TAA、SMAA等多种抗锯齿技术
- **自适应质量控制** - 根据设备性能自动调整渲染质量
- **环境映射** - 程序化和HDR环境贴图支持

## 主要组件

### 1. HighQualityRenderer
主要的渲染器类，整合了所有渲染功能。

```javascript
import { HighQualityRenderer } from './src/core/rendering/HighQualityRenderer.js';

// 创建高质量渲染器
const renderer = new HighQualityRenderer(containerElement);

// 添加模型（自动优化材质）
renderer.addModel(fbxModel);

// 设置环境
renderer.setEnvironment('studio'); // 'studio', 'outdoor', 'sunset'

// 设置质量等级
renderer.setQuality('high'); // 'low', 'medium', 'high', 'ultra'

// 启用自适应质量
renderer.setAdaptiveQuality(true);

// 渲染循环
function animate() {
  requestAnimationFrame(animate);
  renderer.render();
}
```

### 2. 质量等级配置

系统提供4个质量等级：

#### Low Quality
- 像素比率: 1
- 阴影贴图: 512x512
- 抗锯齿: 禁用
- 后处理: 禁用

#### Medium Quality
- 像素比率: 1
- 阴影贴图: 1024x1024
- 抗锯齿: 启用
- 后处理: 禁用

#### High Quality
- 像素比率: min(devicePixelRatio, 2)
- 阴影贴图: 2048x2048
- 抗锯齿: 启用
- 后处理: 启用

#### Ultra Quality
- 像素比率: devicePixelRatio
- 阴影贴图: 4096x4096
- 抗锯齿: 启用
- 后处理: 启用

### 3. 后处理效果

#### SSAO (屏幕空间环境光遮蔽)
```javascript
// 调整SSAO参数
renderer.postProcessing.setSSAOParams({
  kernelRadius: 8,
  minDistance: 0.005,
  maxDistance: 0.1,
  intensity: 0.25
});
```

#### Bloom (辉光效果)
```javascript
// 调整Bloom参数
renderer.postProcessing.setBloomParams({
  threshold: 0.85,
  strength: 0.5,
  radius: 0.4
});
```

#### 抗锯齿
```javascript
// 设置抗锯齿方法
renderer.postProcessing.setAntiAliasingMethod('fxaa'); // 'fxaa', 'taa', 'smaa'
```

### 4. 环境映射

#### 程序化环境
```javascript
// 使用预设环境
renderer.setEnvironment('studio');   // 工作室环境
renderer.setEnvironment('outdoor');  // 户外环境
renderer.setEnvironment('sunset');   // 日落环境
```

#### HDR环境贴图
```javascript
// 加载HDR环境贴图
const envLoader = renderer.environmentLoader;
const envMap = await envLoader.loadHDREnvironment('./path/to/environment.hdr');
renderer.scene.environment = envMap;
```

### 5. 性能监控

```javascript
// 获取性能统计
const stats = renderer.getPerformanceStats();
console.log('Current FPS:', stats.currentFPS);
console.log('Average FPS:', stats.averageFPS);
console.log('Current Quality:', stats.currentQuality);
console.log('Device Score:', stats.deviceScore);
```

## 配置选项

### 渲染器配置 (src/config/renderConfig.js)

```javascript
export const RENDERER_CONFIG = {
  antialias: true,
  powerPreference: "high-performance",
  pixelRatio: Math.min(window.devicePixelRatio, 2),
  outputColorSpace: 'srgb',
  toneMapping: 'ACESFilmic',
  toneMappingExposure: 1.0
};
```

### PBR材质配置

```javascript
export const PBR_MATERIAL_CONFIG = {
  metalness: 0.1,
  roughness: 0.7,
  envMapIntensity: 1.0,
  clearcoat: 0.0,
  transmission: 0.0
};
```

### 光照配置

```javascript
export const LIGHTING_CONFIG = {
  directional: {
    color: 0xffffff,
    intensity: 3.0,
    position: [10, 10, 5],
    castShadow: true
  },
  ambient: {
    color: 0xffffff,
    intensity: 0.4
  }
};
```

## 性能优化建议

### 1. 自适应质量
启用自适应质量控制，系统会根据实际性能自动调整渲染质量：

```javascript
renderer.setAdaptiveQuality(true);
```

### 2. 设备检测
系统会自动检测设备性能并推荐合适的质量等级：

```javascript
const recommendedQuality = renderer.qualityController.getRecommendedQuality();
renderer.setQuality(recommendedQuality);
```

### 3. 手动优化
对于特定场景，可以手动调整设置：

```javascript
// 降低阴影质量
renderer.qualityController.applyQualitySettings('medium');

// 禁用特定后处理效果
renderer.postProcessing.toggleEffect('bloom', false);

// 调整抗锯齿方法
renderer.postProcessing.setAntiAliasingMethod('fxaa');
```

## 故障排除

### 1. 性能问题
- 检查设备性能评分
- 降低质量等级
- 禁用后处理效果
- 减小阴影贴图大小

### 2. 视觉质量问题
- 确保使用PBR材质
- 检查环境映射设置
- 调整光照参数
- 启用后处理效果

### 3. 兼容性问题
- 检查WebGL支持
- 降级到基础渲染器
- 禁用高级特性

## 升级说明

从旧版本升级时，需要注意：

1. **Three.js版本** - 已升级到0.178.0
2. **材质系统** - 自动转换为PBR材质
3. **光照系统** - 使用新的光照配置
4. **渲染循环** - 使用新的渲染器

## API参考

### HighQualityRenderer

- `addModel(model)` - 添加模型并优化材质
- `setEnvironment(name)` - 设置环境映射
- `setQuality(quality)` - 设置质量等级
- `setAdaptiveQuality(enabled)` - 启用自适应质量
- `getPerformanceStats()` - 获取性能统计
- `render()` - 渲染一帧
- `onWindowResize()` - 窗口大小调整
- `dispose()` - 清理资源

### QualityController

- `setQuality(quality)` - 设置质量等级
- `getRecommendedQuality()` - 获取推荐质量
- `setAdaptiveQuality(enabled)` - 启用自适应质量
- `getPerformanceStats()` - 获取性能统计
- `setTargetFPS(fps)` - 设置目标帧率

### PostProcessing

- `setAntiAliasingMethod(method)` - 设置抗锯齿方法
- `setSSAOParams(params)` - 设置SSAO参数
- `setBloomParams(params)` - 设置Bloom参数
- `toggleEffect(name, enabled)` - 启用/禁用效果

这个高质量渲染系统为您的3D应用提供了专业级的视觉效果，同时保持了良好的性能和兼容性。
