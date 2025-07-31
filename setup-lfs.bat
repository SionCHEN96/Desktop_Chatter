@echo off
echo Setting up Git LFS for AI Companion project...

echo.
echo Step 1: Installing Git LFS hooks...
git lfs install

echo.
echo Step 2: Tracking large file types...
git lfs track "*.pth"
git lfs track "*.pt"
git lfs track "*.bin"
git lfs track "*.onnx"
git lfs track "*.h5"
git lfs track "*.vrm"
git lfs track "*.glb"
git lfs track "*.wav"
git lfs track "*.mp3"
git lfs track "*.mp4"
git lfs track "*.zip"
git lfs track "*.db"
git lfs track "*.sqlite3"

echo.
echo Step 3: Tracking specific directories...
git lfs track "public/VTS_Models/**"
git lfs track "public/models/**"
git lfs track "public/Animations/**"

echo.
echo Step 4: Adding .gitattributes to git...
git add .gitattributes

echo.
echo Step 5: Checking LFS status...
git lfs ls-files

echo.
echo Step 6: Showing tracked patterns...
git lfs track

echo.
echo Git LFS setup completed!
echo.
echo Next steps:
echo 1. Commit the .gitattributes file: git commit -m "Add Git LFS configuration"
echo 2. Add your large files: git add public/VTS_Models/
echo 3. Commit the large files: git commit -m "Add model files to LFS"
echo 4. Push to remote: git push

pause
