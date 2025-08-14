# 🎵 语音功能开关测试指南

## 功能说明

托盘设置菜单现在包含一个简单的语音开关，控制AI回复的行为：

### 🔊 语音开启时
- AI回复后先合成第一段语音
- 语音合成完成后显示AI回复气泡
- 继续合成和播放后续段落
- 所有语音播放完成后气泡消失

### 🔇 语音关闭时
- AI回复后直接显示AI回复气泡
- 不进行语音合成
- 气泡显示10秒后自动消失

## 测试步骤

### 1. 启动应用
```bash
npm start
```

### 2. 检查托盘菜单
1. 右键点击系统托盘图标
2. 点击 "Settings" 
3. 查看 "Enable Voice" 选项（默认勾选）

### 3. 测试语音开启状态
1. 确保 "Enable Voice" 已勾选
2. 在应用中发送消息："你好，请介绍一下你自己"
3. 观察行为：
   - ✅ AI回复生成后不立即显示气泡
   - ✅ 等待第一段语音合成完成
   - ✅ 语音合成完成后显示AI气泡
   - ✅ 开始播放语音
   - ✅ 所有语音播放完成后气泡消失

### 4. 测试语音关闭状态
1. 右键托盘图标 → Settings → 取消勾选 "Enable Voice"
2. 在应用中发送消息："今天天气怎么样？"
3. 观察行为：
   - ✅ AI回复生成后立即显示气泡
   - ✅ 没有语音合成过程
   - ✅ 气泡显示10秒后自动消失

### 5. 测试动态切换
1. 在对话过程中切换语音开关
2. 发送新消息验证设置生效
3. 检查控制台日志确认设置变更

## 预期日志输出

### 语音开启时
```
[TrayService] Voice toggled: true
[MessageManager] Voice setting changed: true
[MessageManager] Voice enabled: true
[IPCService] Voice enabled, synthesizing speech for AI response...
[MessageManager] First segment ready, showing AI bubble
```

### 语音关闭时
```
[TrayService] Voice toggled: false
[MessageManager] Voice setting changed: false
[MessageManager] Voice enabled: false
[IPCService] Voice disabled, skipping speech synthesis
[MessageManager] Voice disabled, showing bubble immediately
```

## 技术实现

### 托盘菜单结构
```
Settings
└── Enable Voice [✓]
────────────────
Quit
```

### 数据流
```
托盘菜单点击 → TrayService.handleVoiceToggle() 
              ↓
              发送 'voice-setting-changed' 事件
              ↓
              MessageManager 接收并更新 voiceEnabled
              ↓
              影响后续 AI 回复的显示逻辑
```

### 关键文件修改
- `src/main/services/trayService.js` - 托盘菜单和语音开关
- `src/main/services/ipcService.js` - 根据设置决定是否合成语音
- `src/renderer/components/MessageManager.js` - 根据设置决定气泡显示时机
- `src/preload.js` - 语音设置API

## 故障排除

### 问题1：菜单不显示
- 检查托盘图标是否正确创建
- 查看控制台是否有错误信息

### 问题2：设置不生效
- 检查 `voice-setting-changed` 事件是否正确发送
- 查看 MessageManager 是否正确接收事件

### 问题3：语音仍在合成
- 确认 IPCService 中的语音检查逻辑
- 查看 `isVoiceEnabled()` 返回值

### 问题4：气泡显示异常
- 检查 MessageManager 中的条件判断
- 确认 `voiceEnabled` 状态是否正确更新

## 验证清单

- [ ] 托盘菜单显示 "Enable Voice" 选项
- [ ] 默认状态为开启（勾选）
- [ ] 点击可以切换开关状态
- [ ] 语音开启时：先合成语音再显示气泡
- [ ] 语音关闭时：直接显示气泡
- [ ] 设置变更立即生效
- [ ] 控制台日志正确输出
- [ ] 不影响其他功能（分段TTS、气泡超时等）

## 注意事项

1. **保持简单**：只添加了语音开关，没有修改其他复杂功能
2. **向后兼容**：默认开启语音，保持原有行为
3. **实时生效**：设置变更立即影响新的AI回复
4. **状态持久化**：当前实现不保存设置，重启后恢复默认值
5. **错误处理**：语音合成失败时仍会显示气泡
