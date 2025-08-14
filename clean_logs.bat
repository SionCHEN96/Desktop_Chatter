@echo off
echo ========================================
echo Desktop Chatter - Log Cleanup Tool
echo ========================================
echo.

echo Cleaning up log files...

REM Clean Fish Speech logs
if exist "fish-speech-test\logs\*.log" (
    echo Cleaning Fish Speech logs...
    del /q "fish-speech-test\logs\*.log" 2>nul
    echo Fish Speech logs cleaned.
) else (
    echo No Fish Speech logs found.
)

REM Clean temp files
if exist "temp\*.*" (
    echo Cleaning temp files...
    del /q "temp\*.*" 2>nul
    echo Temp files cleaned.
) else (
    echo No temp files found.
)

REM Clean generated audio files (optional)
set /p cleanup_audio="Clean generated audio files? (y/N): "
if /i "%cleanup_audio%"=="y" (
    if exist "fish-speech-test\generated_audio\*.wav" (
        echo Cleaning generated audio files...
        del /q "fish-speech-test\generated_audio\*.wav" 2>nul
        echo Generated audio files cleaned.
    ) else (
        echo No generated audio files found.
    )
)

echo.
echo ========================================
echo Log cleanup completed!
echo ========================================
echo.
pause
