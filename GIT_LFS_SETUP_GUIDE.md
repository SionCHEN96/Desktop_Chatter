# Git LFS 设置指南 - AI Companion 项目

## 📋 概述

本项目已经配置为使用 Git LFS (Large File Storage) 来管理大文件，特别是AI模型文件和其他大型资源文件。

## 🔍 已发现的大文件

以下文件已被识别为需要LFS管理的大文件：

```
public/VTS_Models/D_0-p.pth    (187 MB)
public/VTS_Models/D_0.pth      (561 MB)
public/VTS_Models/G_0-p.pth    (158 MB)
public/VTS_Models/G_0.pth      (479 MB)
public/VTS_Models/G_953000.pth (479 MB)
```

## ✅ 已完成的配置

### 1. Git LFS 初始化
```bash
git lfs install
```

### 2. .gitattributes 配置
已创建完整的 `.gitattributes` 文件，包含以下文件类型的LFS跟踪：

#### AI/ML 模型文件
- `*.pth` - PyTorch模型文件
- `*.pt` - PyTorch模型文件
- `*.bin` - 二进制模型文件
- `*.onnx` - ONNX模型文件
- `*.h5` - HDF5模型文件
- `*.pkl`, `*.pickle` - Python pickle文件
- `*.safetensors` - SafeTensors格式

#### 3D模型文件
- `*.vrm` - VRM虚拟角色模型
- `*.glb`, `*.gltf` - glTF 3D模型
- `*.fbx`, `*.obj`, `*.dae` - 其他3D模型格式

#### 媒体文件
- `*.wav`, `*.mp3`, `*.ogg`, `*.flac`, `*.aac` - 音频文件
- `*.mp4`, `*.avi`, `*.mov`, `*.mkv`, `*.webm` - 视频文件
- `*.psd`, `*.tiff`, `*.tga`, `*.exr`, `*.hdr` - 大型图像文件

#### 其他大文件
- `*.zip`, `*.rar`, `*.7z`, `*.tar.gz`, `*.tar.bz2` - 压缩文件
- `*.db`, `*.sqlite`, `*.sqlite3` - 数据库文件
- `*.parquet` - 数据文件

#### 特定目录
- `public/VTS_Models/**` - VTS模型目录
- `public/models/**` - 模型目录
- `public/Animations/**` - 动画目录

## 🚀 下一步操作

### 1. 添加大文件到LFS
```bash
# 添加模型文件到git（这会自动使用LFS）
git add public/VTS_Models/

# 检查LFS状态
git lfs ls-files

# 提交更改
git commit -m "Add model files to LFS"
```

### 2. 推送到远程仓库
```bash
# 推送到远程仓库（包括LFS文件）
git push origin TTS
```

### 3. 验证LFS设置
```bash
# 查看LFS跟踪的文件模式
git lfs track

# 查看LFS文件列表
git lfs ls-files

# 查看LFS存储使用情况
git lfs env
```

## 🔧 故障排除

### 如果文件没有被LFS跟踪
1. 确保 `.gitattributes` 文件已提交
2. 重新添加文件：
   ```bash
   git rm --cached public/VTS_Models/*.pth
   git add public/VTS_Models/*.pth
   ```

### 如果需要迁移现有文件到LFS
```bash
# 迁移现有的大文件到LFS
git lfs migrate import --include="*.pth" --everything
```

### 检查文件是否在LFS中
```bash
# 查看文件信息
git lfs pointer --file=public/VTS_Models/D_0.pth
```

## 📊 LFS配置摘要

- ✅ Git LFS 已安装并初始化
- ✅ `.gitattributes` 文件已配置
- ✅ 支持40+种大文件格式
- ✅ 特定目录自动LFS跟踪
- ⏳ 大文件正在添加到LFS中

## 🎯 优势

使用Git LFS后，项目将获得以下优势：

1. **更快的克隆速度** - 大文件不会影响git clone速度
2. **更小的仓库大小** - 本地仓库只存储文件指针
3. **更好的性能** - git操作更快速
4. **版本控制** - 大文件仍然有完整的版本历史
5. **带宽优化** - 只下载需要的文件版本

## 📝 注意事项

1. 确保团队成员都安装了Git LFS
2. 首次克隆后需要运行 `git lfs pull` 来下载大文件
3. LFS存储可能有配额限制（取决于Git托管服务）
4. 推送大文件时可能需要更长时间

## 🔗 相关命令参考

```bash
# 安装LFS钩子
git lfs install

# 跟踪文件类型
git lfs track "*.pth"

# 查看跟踪状态
git lfs track

# 查看LFS文件
git lfs ls-files

# 拉取LFS文件
git lfs pull

# 查看LFS环境
git lfs env
```
