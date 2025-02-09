@echo off
setlocal enabledelayedexpansion

:menu
cls
echo Ollama GUI Launcher
echo =================
echo 1. Development Mode (npm run dev)
echo 2. Preview Mode (with network access)
echo 3. Build and Preview
echo 4. Exit
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo Starting development server...
    npm run dev -- --host
    goto menu
)
if "%choice%"=="2" (
    echo Starting preview server...
    npx vite preview --host
    goto menu
)
if "%choice%"=="3" (
    echo Building and starting preview server...
    call npm run build
    if !errorlevel! equ 0 (
        echo Build successful! Starting preview server...
        npx vite preview --host
    ) else (
        echo Build failed! Press any key to return to menu...
        pause >nul
    )
    goto menu
)
if "%choice%"=="4" (
    echo Exiting...
    exit /b 0
)

echo Invalid choice! Press any key to try again...
pause >nul
goto menu
