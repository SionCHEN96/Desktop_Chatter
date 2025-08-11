# PowerShell script to setup .gitignore for generated_audio directory

Write-Host "Setting up .gitignore for generated_audio directory..." -ForegroundColor Green

# Change to the correct directory
Set-Location "E:\Personal\Desktop_Chatter\fish-speech-test"

Write-Host "`n1. Current Git status:" -ForegroundColor Yellow
git status

Write-Host "`n2. Adding .gitignore file..." -ForegroundColor Yellow
git add .gitignore

Write-Host "`n3. Checking what audio files are tracked..." -ForegroundColor Yellow
git ls-files generated_audio/

Write-Host "`n4. Removing tracked audio files from Git..." -ForegroundColor Yellow
$audioFiles = git ls-files generated_audio/
if ($audioFiles) {
    foreach ($file in $audioFiles) {
        Write-Host "Removing: $file" -ForegroundColor Cyan
        git rm --cached $file
    }
} else {
    Write-Host "No audio files are currently tracked by Git." -ForegroundColor Green
}

Write-Host "`n5. Current Git status after changes:" -ForegroundColor Yellow
git status

Write-Host "`n6. Committing changes..." -ForegroundColor Yellow
git commit -m "Add .gitignore to exclude generated_audio files"

Write-Host "`n7. Verifying setup..." -ForegroundColor Yellow
Write-Host "Files still tracked in generated_audio/:" -ForegroundColor Cyan
git ls-files generated_audio/

Write-Host "`n8. Testing with a new file..." -ForegroundColor Yellow
"test" | Out-File -FilePath "generated_audio/test.wav" -Encoding ASCII
Write-Host "Created test file: generated_audio/test.wav" -ForegroundColor Cyan
Write-Host "Git status (should not show the test file):" -ForegroundColor Cyan
git status --porcelain generated_audio/

Write-Host "`nSetup complete! Generated audio files will now be ignored by Git." -ForegroundColor Green
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
