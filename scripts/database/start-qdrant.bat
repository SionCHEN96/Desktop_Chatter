@echo off
chcp 65001 >nul
echo Starting Qdrant database container...
docker start qdrant-db
if %ERRORLEVEL% EQU 0 (
    echo Qdrant database container started successfully.
) else (
    echo Failed to start Qdrant database container.
    exit /b %ERRORLEVEL%
)