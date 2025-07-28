@echo off
chcp 65001 >nul
echo Checking if qdrant-db container exists...
docker ps -a --format "{{.Names}}" | findstr "qdrant-db" >nul
if %ERRORLEVEL% EQU 0 (
    echo qdrant-db container exists. Starting it...
    docker start qdrant-db
) else (
    echo qdrant-db container does not exist. Creating and starting it...
    mkdir qdrant_data 2>nul
    docker run -d -p 6333:6333 -p 6334:6334 --name qdrant-db -v "./qdrant_data:/qdrant/storage" -e QDRANT__STORAGE__ENABLE_FS_CHECK=false qdrant/qdrant
)
if %ERRORLEVEL% EQU 0 (
    echo Qdrant database started successfully.
) else (
    echo Failed to start Qdrant database.
    exit /b %ERRORLEVEL%
)