@echo off
echo Checking for processes using port 8080...

:: 查找占用8080端口的进程
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do (
    echo Found process using port 8080: %%a
    taskkill /f /pid %%a
    echo Process %%a terminated.
)

echo Port 8080 cleanup completed.
pause
