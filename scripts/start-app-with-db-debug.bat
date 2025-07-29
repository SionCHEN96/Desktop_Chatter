@echo off
echo Starting Qdrant database and AI Companion app...

REM Start Qdrant database
echo Starting Qdrant database...
docker start qdrant-db >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Qdrant database started successfully.
) else (
    echo Qdrant container not found. Creating and starting a new one...
    mkdir qdrant_data 2>nul
    docker run -d -p 6333:6333 -p 6334:6334 --name qdrant-db -v "./qdrant_data:/qdrant/storage" -e QDRANT__STORAGE__ENABLE_FS_CHECK=false qdrant/qdrant >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo Qdrant database created and started successfully.
    ) else (
        echo Failed to create and start Qdrant database.
        exit /b %ERRORLEVEL%
    )
)

REM Wait for database to start
echo Waiting for database to be ready...
timeout /t 10 /nobreak >nul

REM Check if database is responding
echo Checking if database is responding...
curl -s -f http://localhost:6333 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Database is responding.
) else (
    echo Database is not responding. Please check the Docker container.
    exit /b 1
)

REM Start AI Companion app
echo Starting AI Companion app...
npm start