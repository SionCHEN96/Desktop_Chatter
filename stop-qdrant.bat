@echo off
echo Stopping Qdrant database container...
docker stop qdrant-db
if %ERRORLEVEL% EQU 0 (
    echo Qdrant database container stopped successfully.
) else (
    echo Failed to stop Qdrant database container.
    exit /b %ERRORLEVEL%
)