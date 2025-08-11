@echo off
echo Setting up .gitignore for generated_audio directory...

echo.
echo 1. Adding .gitignore file to Git...
git add .gitignore

echo.
echo 2. Removing generated_audio files from Git tracking...
git rm --cached generated_audio/*.wav

echo.
echo 3. Checking Git status...
git status

echo.
echo 4. Committing changes...
git commit -m "Add .gitignore to exclude generated_audio files"

echo.
echo Setup complete! Generated audio files will now be ignored by Git.
pause
