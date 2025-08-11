# Git 忽略 generated_audio 文件的命令

由于自动启动脚本的干扰，请手动在命令行中执行以下Git命令：

## 步骤1: 添加 .gitignore 文件
```bash
git add .gitignore
```

## 步骤2: 从Git跟踪中移除已存在的音频文件
```bash
git rm --cached generated_audio/*.wav
```

如果上面的命令失败，可以尝试逐个移除：
```bash
git rm --cached "generated_audio/tts_1754902407005.wav"
git rm --cached "generated_audio/tts_1754902576110.wav"
git rm --cached "generated_audio/tts_1754903526917.wav"
git rm --cached "generated_audio/voice_clone_1754903513063.wav"
git rm --cached "generated_audio/voice_clone_1754903826717.wav"
git rm --cached "generated_audio/voice_clone_1754903844568.wav"
```

## 步骤3: 检查状态
```bash
git status
```

## 步骤4: 提交更改
```bash
git commit -m "Add .gitignore to exclude generated_audio files"
```

## 验证
执行以下命令验证设置是否成功：
```bash
git ls-files generated_audio/
```
如果没有输出，说明generated_audio目录下的文件已经被成功忽略。

## 测试
创建一个新的音频文件测试：
```bash
echo "test" > generated_audio/test.wav
git status
```
新创建的文件应该不会出现在git status的输出中。
