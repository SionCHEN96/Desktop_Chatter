# 🎵 分段TTS功能说明

## 功能概述

分段TTS（Text-to-Speech）功能将长文本分割成多个段落，实现逐段合成和播放，提供更好的用户体验。

## 工作流程

### 1. 文本分段
- 使用 `segmentText()` 函数将长文本智能分割
- 按句号、感叹号、问号等标点符号分段
- 控制每段长度在合理范围内（8-80字符）

### 2. 第一段优先处理
```
用户发送消息 → 文本分段 → 立即合成第一段 → 显示AI气泡 → 播放第一段
```

### 3. 后台并行合成
```
第一段播放时 → 后台合成第2、3、4...段 → 逐个准备完成
```

### 4. 顺序播放
```
第一段播放完 → 检查第二段是否准备好 → 播放第二段 → 继续下一段...
```

### 5. 气泡管理
```
第一段准备好 → 显示AI气泡 + 启动30秒计时器
所有段落播放完 → 清除AI气泡（如果未超时）
30秒超时 → 自动清除AI气泡
```

## 核心组件

### AudioQueue.js
负责音频队列管理和播放控制：

```javascript
class AudioQueue {
  // 开始分段合成和播放
  async startSegmentedSynthesis(textSegments, synthesizeFunction, callbacks)
  
  // 顺序合成和播放
  async startSequentialSynthesisAndPlayback()
  
  // 后台继续合成剩余段落
  async continueBackgroundSynthesis()
  
  // 播放单个段落
  async playSegment(segment, index)
  
  // 播放下一段
  async playNextSegment(currentIndex)
}
```

### MessageManager.js
负责消息管理和UI控制：

```javascript
class MessageManager {
  // 处理分段TTS
  async handleSegmentedTTS(message)
  
  // 启动气泡显示计时器
  startBubbleDisplayTimer()
  
  // 清除气泡（如果未超时）
  clearBubbleIfNotTimeout()
}
```

## 关键特性

### ✅ 即时响应
- 第一段合成完立即显示AI气泡
- 用户无需等待整个文本合成完成

### ✅ 并行处理
- 第一段播放时，后台并行合成其他段落
- 最大化利用系统资源

### ✅ 智能等待
- 自动等待下一段准备完成
- 超时保护，避免无限等待

### ✅ 错误容错
- 单段失败不影响其他段落
- 自动跳过失败的段落继续播放

### ✅ 超时管理
- 30秒自动超时保护
- 防止AI气泡长时间占用界面

## 配置参数

### 文本分段参数
```javascript
{
  maxSegmentLength: 80,    // 最大段落长度
  minSegmentLength: 8,     // 最小段落长度
  preferredLength: 40      // 首选段落长度
}
```

### 音频队列参数
```javascript
{
  maxDisplayTime: 30000,   // 最大显示时间（30秒）
  maxWaitTime: 15000,      // 最大等待时间（15秒）
  checkInterval: 200       // 检查间隔（200ms）
}
```

## 使用示例

### 基本用法
```javascript
// 1. 分段文本
const segments = segmentText(longText, {
  maxSegmentLength: 80,
  minSegmentLength: 8,
  preferredLength: 40
});

// 2. 开始分段TTS
audioQueue.startSegmentedSynthesis(
  segments,
  (text) => synthesizeTextSegment(text),
  {
    onSegmentReady: (segment) => {
      // 第一段准备好，显示AI气泡
      showAIBubble();
      startTimer();
    },
    onAllComplete: () => {
      // 所有段落完成，清除气泡
      clearAIBubble();
    },
    onError: (error) => {
      // 处理错误
      handleError(error);
    }
  }
);
```

### 高级配置
```javascript
// 自定义分段策略
const customSegments = segmentText(text, {
  maxSegmentLength: 100,   // 更长的段落
  minSegmentLength: 15,    // 更长的最小长度
  preferredLength: 60      // 更长的首选长度
});

// 自定义超时时间
audioQueue.maxDisplayTime = 45000; // 45秒超时
```

## 测试工具

### 1. HTML测试页面
```bash
# 打开浏览器访问
test_segmented_tts.html
```

### 2. JavaScript测试脚本
```bash
# Node.js环境运行
node test_segmented_tts.js
```

### 3. 浏览器控制台测试
```javascript
// 在浏览器控制台运行
testSegmentedTTS();
```

## 故障排除

### 问题1：第一段合成太慢
**解决方案：**
- 检查TTS服务状态
- 优化网络连接
- 减少第一段文本长度

### 问题2：后续段落播放中断
**解决方案：**
- 检查后台合成是否成功
- 增加等待超时时间
- 检查音频文件是否正确生成

### 问题3：AI气泡不消失
**解决方案：**
- 检查 `onAllComplete` 回调是否正确触发
- 检查超时计时器是否正常工作
- 手动调用 `clearBubbleIfNotTimeout()`

### 问题4：音频播放失败
**解决方案：**
- 检查用户是否已交互（浏览器限制）
- 检查音频URL是否正确
- 检查音频文件是否存在

## 性能优化

### 1. 合成优化
- 并行合成多个段落
- 预测性合成下一段
- 缓存已合成的音频

### 2. 播放优化
- 预加载下一段音频
- 无缝切换段落
- 减少播放延迟

### 3. 内存优化
- 及时清理已播放的音频
- 限制同时存在的音频对象数量
- 避免内存泄漏

## 更新日志

### v1.0.0 (2024-01-XX)
- ✅ 实现基本分段TTS功能
- ✅ 支持并行合成和顺序播放
- ✅ 添加超时保护机制
- ✅ 完善错误处理逻辑

### 计划功能
- 🔄 支持暂停/恢复播放
- 🔄 支持播放速度调节
- 🔄 支持音频格式选择
- 🔄 支持语音情感控制
