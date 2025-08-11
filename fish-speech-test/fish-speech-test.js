/**
 * Fish Speech TTS 测试页面 JavaScript
 */

class FishSpeechTester {
    constructor() {
        this.apiBaseUrl = '/api';
        this.currentAudio = null;
        this.config = null;
        
        this.init();
    }

    async init() {
        console.log('🐟 Fish Speech Tester 初始化...');
        
        // 绑定事件
        this.bindEvents();
        
        // 加载配置
        await this.loadConfig();
        
        // 检查服务状态
        await this.checkServiceStatus();
        
        // 生成情感标记
        this.generateEmotionTags();
        
        console.log('✅ Fish Speech Tester 初始化完成');
    }

    bindEvents() {
        // 表单提交
        const form = document.getElementById('tts-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.synthesizeSpeech();
        });

        // 文件上传
        const fileInput = document.getElementById('reference-audio');
        fileInput.addEventListener('change', this.handleFileUpload.bind(this));

        // 拖拽上传
        const fileLabel = document.querySelector('.file-upload-label');
        fileLabel.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileLabel.style.background = '#e3f2fd';
        });
        
        fileLabel.addEventListener('dragleave', (e) => {
            e.preventDefault();
            fileLabel.style.background = '#f8f9fa';
        });
        
        fileLabel.addEventListener('drop', (e) => {
            e.preventDefault();
            fileLabel.style.background = '#f8f9fa';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                this.handleFileUpload({ target: fileInput });
            }
        });
    }

    async loadConfig() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/config`);
            this.config = await response.json();
            console.log('📋 配置加载成功:', this.config);
        } catch (error) {
            console.error('❌ 配置加载失败:', error);
            this.showStatus('配置加载失败', 'error');
        }
    }

    async checkServiceStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/fish-speech/status`);
            const status = await response.json();
            
            if (status.status === 'available') {
                this.showStatus(
                    `✅ Fish Speech 服务可用 (${status.type === 'local' ? '本地' : 'Hugging Face'})`,
                    'success'
                );
            } else {
                this.showStatus(
                    `⚠️ Fish Speech 服务不可用: ${status.message}`,
                    'error'
                );
            }
            
            console.log('🔍 服务状态:', status);
        } catch (error) {
            console.error('❌ 服务状态检查失败:', error);
            this.showStatus('无法连接到Fish Speech服务', 'error');
        }
    }

    generateEmotionTags() {
        if (!this.config) return;
        
        const container = document.getElementById('emotion-tags');
        const allTags = [
            ...this.config.emotions.slice(0, 10), // 前10个情感
            ...this.config.tones.slice(0, 3),     // 前3个语调
            ...this.config.effects.slice(0, 5)    // 前5个效果
        ];
        
        container.innerHTML = '';
        
        allTags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'emotion-tag';
            tagElement.textContent = tag;
            tagElement.addEventListener('click', () => {
                this.insertEmotionTag(tag);
            });
            container.appendChild(tagElement);
        });
    }

    insertEmotionTag(tag) {
        const textInput = document.getElementById('text-input');
        const cursorPos = textInput.selectionStart;
        const textBefore = textInput.value.substring(0, cursorPos);
        const textAfter = textInput.value.substring(cursorPos);
        
        textInput.value = textBefore + tag + ' ' + textAfter;
        textInput.focus();
        textInput.setSelectionRange(cursorPos + tag.length + 1, cursorPos + tag.length + 1);
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const label = document.querySelector('.file-upload-label');
        
        if (file.type.startsWith('audio/')) {
            label.innerHTML = `✅ 已选择: ${file.name} (${this.formatFileSize(file.size)})`;
            label.style.background = '#d4edda';
            label.style.borderColor = '#28a745';
            label.style.color = '#155724';
        } else {
            label.innerHTML = '❌ 请选择音频文件';
            label.style.background = '#f8d7da';
            label.style.borderColor = '#dc3545';
            label.style.color = '#721c24';
            event.target.value = '';
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async synthesizeSpeech() {
        const text = document.getElementById('text-input').value.trim();
        const language = document.getElementById('language-select').value;
        const referenceText = document.getElementById('reference-text').value.trim();
        const referenceAudioFile = document.getElementById('reference-audio').files[0];
        
        if (!text) {
            this.showStatus('请输入要合成的文本', 'error');
            return;
        }
        
        // 显示加载状态
        this.setLoading(true);
        this.showStatus('正在合成语音...', 'info');
        
        try {
            // 准备请求数据
            const requestData = {
                text,
                language,
                reference_text: referenceText || null
            };
            
            // 如果有参考音频，转换为base64
            if (referenceAudioFile) {
                const audioBase64 = await this.fileToBase64(referenceAudioFile);
                requestData.reference_audio = audioBase64;
            }
            
            console.log('🎤 开始合成:', {
                textLength: text.length,
                language,
                hasReferenceAudio: !!referenceAudioFile,
                hasReferenceText: !!referenceText
            });
            
            // 发送合成请求
            const response = await fetch(`${this.apiBaseUrl}/fish-speech/synthesize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (response.ok) {
                // 获取音频数据
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // 显示结果
                this.displayResult(audioUrl, text);
                this.showStatus('✅ 语音合成成功!', 'success');
                
                console.log('✅ 合成成功:', {
                    audioSize: audioBlob.size,
                    audioType: audioBlob.type
                });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || '合成失败');
            }
            
        } catch (error) {
            console.error('❌ 合成失败:', error);
            this.showStatus(`❌ 合成失败: ${error.message}`, 'error');
            this.displayError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1]; // 移除data:audio/...;base64,前缀
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    displayResult(audioUrl, text) {
        const resultArea = document.getElementById('result-area');
        
        // 停止之前的音频
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        
        resultArea.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h3 style="color: #28a745; margin-bottom: 15px;">🎉 合成成功!</h3>
                <p style="color: #666; margin-bottom: 15px;">文本: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"</p>
            </div>
            
            <audio controls class="audio-player" id="result-audio">
                <source src="${audioUrl}" type="audio/wav">
                您的浏览器不支持音频播放。
            </audio>
            
            <div style="margin-top: 15px; text-align: center;">
                <button onclick="fishSpeechTester.downloadAudio('${audioUrl}', '${text}')" class="btn" style="width: auto; padding: 10px 20px;">
                    💾 下载音频
                </button>
            </div>
            
            <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 12px; color: #666;">
                <strong>合成时间:</strong> ${new Date().toLocaleString()}<br>
                <strong>音频格式:</strong> WAV<br>
                <strong>文本长度:</strong> ${text.length} 字符
            </div>
        `;
        
        // 保存当前音频引用
        this.currentAudio = document.getElementById('result-audio');
    }

    displayError(message) {
        const resultArea = document.getElementById('result-area');
        resultArea.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h3 style="color: #dc3545; margin-bottom: 15px;">❌ 合成失败</h3>
                <p style="color: #666;">${message}</p>
                <div style="margin-top: 20px; padding: 15px; background: #f8d7da; border-radius: 8px; color: #721c24;">
                    <strong>可能的解决方案:</strong><br>
                    • 检查Fish Speech服务是否运行<br>
                    • 确认文本格式正确<br>
                    • 检查网络连接<br>
                    • 尝试使用更短的文本
                </div>
            </div>
        `;
    }

    downloadAudio(audioUrl, text) {
        const link = document.createElement('a');
        link.href = audioUrl;
        link.download = `fish-speech-${Date.now()}.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('💾 音频下载:', link.download);
    }

    setLoading(isLoading) {
        const loading = document.getElementById('loading');
        const button = document.getElementById('synthesize-btn');
        
        if (isLoading) {
            loading.classList.add('show');
            button.disabled = true;
            button.textContent = '合成中...';
        } else {
            loading.classList.remove('show');
            button.disabled = false;
            button.textContent = '🎤 开始合成';
        }
    }

    showStatus(message, type = 'info') {
        const statusDisplay = document.getElementById('status-display');
        statusDisplay.innerHTML = `<div class="status ${type}">${message}</div>`;
        
        // 3秒后自动隐藏成功消息
        if (type === 'success') {
            setTimeout(() => {
                statusDisplay.innerHTML = '';
            }, 3000);
        }
    }
}

// 全局实例
let fishSpeechTester;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    fishSpeechTester = new FishSpeechTester();
});
