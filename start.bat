@echo off
setlocal enabledelayedexpansion

echo Checking Node.js dependencies...

REM Check if node_modules exists
if not exist node_modules (
    echo Installing Node.js dependencies...
    call yarn install
    if !errorlevel! neq 0 (
        echo Error: Failed to install Node.js dependencies.
        echo Please ensure Node.js and Yarn are installed and available in PATH.
        pause
        exit /b 1
    )
)

REM Start the speech server in a new window
echo Starting speech server...
start "Speech Server" cmd /c "cd speech_server && start.bat"

REM Wait a moment for the speech server to initialize
timeout /t 2 > nul

REM Start the Vue.js development server
echo Starting Vue.js development server...
call yarn dev

REM If the server stops, wait before closing
pause