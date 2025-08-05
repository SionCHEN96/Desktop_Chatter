/**
 * GPT-SoVITS 测试网页 JavaScript
 * 处理前端交互逻辑和API调用
 */

// 全局变量
let currentAudioBlob = null;
let selectedCharacter = 'XIANGLING';
let availableCharacters = [];

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeUI();
    loadCharacters();
    setupEventListeners();
});

/**
 * 初始化UI组件
 */
function initializeUI() {
    // 设置滑块值显示
    updateSliderValues();
    
    // 设置默认API地址
    const apiUrlInput = document.getElementById('apiUrl');
    if (!apiUrlInput.value) {
        apiUrlInput.value = 'http://localhost:3000/api/gpt-sovits';
    }
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 滑块值变化监听
    document.getElementById('speedFactor').addEventListener('input', updateSliderValues);
    document.getElementById('temperature').addEventListener('input', updateSliderValues);
    document.getElementById('topP').addEventListener('input', updateSliderValues);
    
    // 键盘快捷键
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            synthesizeVoice();
        }
    });
}

/**
 * 更新滑块显示值
 */
function updateSliderValues() {
    const speedFactor = document.getElementById('speedFactor');
    const temperature = document.getElementById('temperature');
    const topP = document.getElementById('topP');
    
    document.getElementById('speedValue').textContent = speedFactor.value + 'x';
    document.getElementById('tempValue').textContent = temperature.value;
    document.getElementById('topPValue').textContent = topP.value;
}

/**
 * 显示状态消息
 */
function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage');
    statusElement.className = `status ${type}`;
    statusElement.textContent = message;
    statusElement.style.display = 'block';
    
    // 自动隐藏成功消息
    if (type === 'success') {
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 3000);
    }
}

/**
 * 隐藏状态消息
 */
function hideStatus() {
    document.getElementById('statusMessage').style.display = 'none';
}

/**
 * 显示/隐藏加载指示器
 */
function showLoading(show = true) {
    const loadingElement = document.getElementById('loadingIndicator');
    const synthesizeBtn = document.getElementById('synthesizeBtn');
    
    if (show) {
        loadingElement.classList.add('show');
        synthesizeBtn.disabled = true;
        synthesizeBtn.textContent = '🔄 合成中...';
    } else {
        loadingElement.classList.remove('show');
        synthesizeBtn.disabled = false;
        synthesizeBtn.textContent = '🎤 开始合成';
    }
}

/**
 * 测试API连接
 */
async function testConnection() {
    const apiUrl = document.getElementById('apiUrl').value;

    if (!apiUrl) {
        showStatus('请输入API地址', 'error');
        return;
    }

    try {
        showStatus('正在测试连接...', 'info');

        // 使用相对路径进行健康检查，避免CORS问题
        const healthUrl = '/api/health';

        console.log('测试连接到:', healthUrl);
        console.log('原始API URL:', apiUrl);

        const response = await fetch(healthUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            showStatus('✅ 连接成功！服务正常运行', 'success');
        } else {
            showStatus(`❌ 连接失败：${response.status} ${response.statusText}`, 'error');
        }
    } catch (error) {
        console.error('Connection test failed:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        showStatus(`❌ 连接失败：${error.message}`, 'error');
    }
}

/**
 * 加载可用角色
 */
async function loadCharacters() {
    const apiUrl = document.getElementById('apiUrl').value;
    
    try {
        // 使用相对路径加载角色
        const charactersUrl = '/api/gpt-sovits/characters';
        console.log('角色加载URL:', charactersUrl);

        const response = await fetch(charactersUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            availableCharacters = await response.json();
            renderCharacterSelector();
        } else {
            console.warn('Failed to load characters, using default');
            availableCharacters = [
                {
                    name: 'XIANGLING',
                    displayName: 'xiangling',
                    refText: '我是不会对食物有什么偏见的，只有不合适的做法...',
                    language: 'zh'
                }
            ];
            renderCharacterSelector();
        }
    } catch (error) {
        console.warn('Failed to load characters:', error);
        availableCharacters = [
            {
                name: 'XIANGLING',
                displayName: 'xiangling',
                refText: '我是不会对食物有什么偏见的，只有不合适的做法...',
                language: 'zh'
            }
        ];
        renderCharacterSelector();
    }
}

/**
 * 渲染角色选择器
 */
function renderCharacterSelector() {
    const container = document.getElementById('characterSelector');
    container.innerHTML = '';
    
    availableCharacters.forEach(character => {
        const card = document.createElement('div');
        card.className = 'character-card';
        if (character.name === selectedCharacter) {
            card.classList.add('selected');
        }
        
        card.innerHTML = `
            <h3>${character.displayName}</h3>
            <p>${character.language.toUpperCase()}</p>
            <p style="font-size: 0.8em; margin-top: 5px;">${character.refText.substring(0, 30)}...</p>
        `;
        
        card.addEventListener('click', () => selectCharacter(character.name));
        container.appendChild(card);
    });
}

/**
 * 选择角色
 */
function selectCharacter(characterName) {
    selectedCharacter = characterName;
    renderCharacterSelector();
    
    // 更新语言选择
    const character = availableCharacters.find(c => c.name === characterName);
    if (character) {
        document.getElementById('textLang').value = character.language;
    }
}

/**
 * 语音合成
 */
async function synthesizeVoice() {
    const apiUrl = document.getElementById('apiUrl').value;
    const text = document.getElementById('textInput').value.trim();
    
    if (!apiUrl) {
        showStatus('请输入API地址', 'error');
        return;
    }
    
    if (!text) {
        showStatus('请输入要合成的文本', 'error');
        return;
    }
    
    try {
        showLoading(true);
        hideStatus();
        
        // 构建请求参数
        const params = {
            text: text,
            character: selectedCharacter,
            text_lang: document.getElementById('textLang').value,
            speed_factor: parseFloat(document.getElementById('speedFactor').value),
            temperature: parseFloat(document.getElementById('temperature').value),
            top_p: parseFloat(document.getElementById('topP').value)
        };
        
        console.log('Synthesis request:', params);
        
        // 使用相对路径进行语音合成
        const synthesizeUrl = '/api/gpt-sovits/synthesize';
        console.log('合成请求URL:', synthesizeUrl);

        const response = await fetch(synthesizeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        // 获取音频数据
        const audioBlob = await response.blob();
        currentAudioBlob = audioBlob;
        
        // 创建音频URL并播放
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioElement = document.getElementById('audioElement');
        audioElement.src = audioUrl;
        
        // 显示音频播放器
        document.getElementById('audioPlayer').style.display = 'block';
        
        showStatus('✅ 语音合成成功！', 'success');
        
    } catch (error) {
        console.error('Synthesis failed:', error);
        showStatus(`❌ 合成失败：${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * 下载音频文件
 */
function downloadAudio() {
    if (!currentAudioBlob) {
        showStatus('没有可下载的音频文件', 'error');
        return;
    }
    
    const url = URL.createObjectURL(currentAudioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gpt-sovits-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('✅ 音频下载开始', 'success');
}

/**
 * 工具函数：格式化时间
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 工具函数：格式化文件大小
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
