@echo off
setlocal EnableExtensions
chcp 65001 >nul
title NoName Multiplayer Launcher

set "ROOT=%~dp0"
set "SERVER=%ROOT%server"

if not exist "%ROOT%index.html" (
    echo [ERROR] index.html was not found in:
    echo %ROOT%
    pause
    exit /b 1
)
if not exist "%SERVER%\package.json" (
    echo [ERROR] server\package.json was not found.
    pause
    exit /b 1
)

set "NODE_CMD="
where node.exe >nul 2>&1
if not errorlevel 1 set "NODE_CMD=node.exe"
if not defined NODE_CMD (
    echo [ERROR] Node.js was not found. Install Node.js first.
    pause
    exit /b 1
)

set "PNPM_CMD="
where pnpm.cmd >nul 2>&1
if not errorlevel 1 set "PNPM_CMD=pnpm.cmd"
if not defined PNPM_CMD (
    where corepack.cmd >nul 2>&1
    if not errorlevel 1 set "PNPM_CMD=corepack pnpm"
)
if not defined PNPM_CMD (
    echo [ERROR] pnpm was not found. Install pnpm first.
    pause
    exit /b 1
)

if not exist "%SERVER%\node_modules\tsup" (
    echo Installing server dependencies...
    pushd "%SERVER%"
    %PNPM_CMD% install
    if errorlevel 1 (
        popd
        echo [ERROR] Dependency installation failed.
        pause
        exit /b 1
    )
    popd
)

echo ========================================
echo   NoName multiplayer startup
echo ========================================
echo.
echo [1/3] Starting web server on TCP 8080...
start "NoName Web 8080" /D "%ROOT%" cmd /k "%NODE_CMD% web-server.mjs --port 8080"

echo [2/3] Building and starting WebSocket server on TCP 8082...
start "NoName WebSocket 8082" /D "%SERVER%" cmd /k "%PNPM_CMD% run build && node dist\cli.js --port 8082"

echo [3/3] Opening the local game page...
timeout /t 3 /nobreak >nul
start "" http://127.0.0.1:8080/

echo.
echo ========================================
echo   Multiplayer services started
echo ========================================
echo Local game page: http://127.0.0.1:8080/
echo LAN players:      http://YOUR-PC-IP:8080/
echo Multiplayer port: YOUR-PC-IP:8082
echo.
echo Detected IPv4 addresses:
ipconfig | findstr /i "IPv4"
echo.
echo Keep the two service windows open while playing.
echo Other computers do not run this .bat; they open the LAN URL above.
echo Allow TCP 8080 and 8082 through Windows Firewall if needed.
echo ========================================
echo.
pause
exit /b 0
