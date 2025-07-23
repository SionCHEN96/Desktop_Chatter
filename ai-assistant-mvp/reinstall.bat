@echo off
echo 正在重新安装依赖项...
cd /d "%~dp0"
rmdir /s /q node_modules
del package-lock.json
npm install
echo 安装完成，现在运行应用...
npm start