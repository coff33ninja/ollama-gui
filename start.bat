@echo on
setlocal enabledelayedexpansion

:: === Initial Setup ===
echo Checking Node.js dependencies...
call :check_node_dependencies || exit /b 1

echo Starting Vue.js development server...
call :start_vue_server || exit /b 1

echo Starting speech server...
call :start_speech_server || exit /b 1

echo All processes started successfully.
exit /b 0

:: ========== FUNCTIONS ==========

:: Check and Install Node.js Dependencies
:check_node_dependencies
if not exist node_modules (
    echo Installing Node.js dependencies...

    npm -v >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo NPM detected. Running "npm install"...
        call npm install
        if !ERRORLEVEL! NEQ 0 (
            echo Error: Failed to install dependencies with npm.
            pause
            exit /b 1
        )
        exit /b 0
    )

    yarn -v >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo Yarn detected. Running "yarn install"...
        call yarn install
        if !ERRORLEVEL! NEQ 0 (
            echo Error: Failed to install dependencies with yarn.
            pause
            exit /b 1
        )
        exit /b 0
    )

    echo Error: Neither npm nor yarn is installed. Please install Node.js.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)
exit /b 0

:: Start Vue.js Development Server in a new terminal
:start_vue_server
npm -v >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Starting Vue.js development server with npm...
    start cmd /k "npm run dev"
    exit /b 0
)

yarn -v >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Starting Vue.js development server with Yarn...
    start cmd /k "yarn dev"
    exit /b 0
)

echo Error: Neither npm nor yarn is installed.
echo Download: https://nodejs.org/
call :cleanup
exit /b 1

:: Start Speech Server in a new terminal
:start_speech_server
echo Starting speech server...
start cmd /k "cd /d speech_server && start.bat"

:: Verify Speech Server is Running
timeout /t 2 > nul
tasklist | find /i "python.exe" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Speech server failed to start.
    call :cleanup
    exit /b 1
)
exit /b 0

:: Cleanup Function
:cleanup
echo Cleaning up processes...
taskkill /f /im python.exe >nul 2>nul
exit /b 0
