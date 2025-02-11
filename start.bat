@echo off
setlocal enabledelayedexpansion

echo Checking Node.js and Python dependencies...

:: === Ensure Dependencies are Installed ===
call :check_node_dependencies
call :check_python_dependencies
call :start_speech_server
call :start_vue_server

echo All processes started successfully.
exit /b 0

:: ========== FUNCTIONS ==========

:: Check and Install Node.js Dependencies
:check_node_dependencies
if not exist node_modules (
    echo Installing Node.js dependencies...

    where yarn >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo Yarn detected. Running "yarn install"...
        call yarn install
        if !ERRORLEVEL! NEQ 0 (
            echo Warning: Yarn install failed. Trying npm...
            call :fallback_npm_install
        )
    ) ELSE (
        echo Yarn not found. Checking for npm...
        call :fallback_npm_install
    )
)
exit /b 0

:fallback_npm_install
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Neither Yarn nor npm is installed. Please install one of them.
    pause
    exit /b 1
)
echo Running "npm install"...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install dependencies with npm.
    pause
    exit /b 1
)
exit /b 0

:: Check and Install Python Dependencies
:check_python_dependencies
if not exist "speech_server\venv\Scripts\activate.bat" (
    echo Virtual environment not found. Creating one...
    python -m venv speech_server\venv
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo Virtual environment created successfully.
)

:: Activate Virtual Environment and Install Packages
call speech_server\venv\Scripts\activate.bat
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to activate virtual environment.
    pause
    exit /b 1
)
echo Virtual environment activated successfully.

if exist "speech_server\requirements.txt" (
    echo Installing required Python packages...
    pip install -r speech_server\requirements.txt
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to install required Python packages.
        pause
        exit /b 1
    )
) ELSE (
    echo Warning: requirements.txt not found. Skipping package installation.
)
exit /b 0

:: Start Speech Server
:start_speech_server
echo Starting speech server...
cd /d speech_server
start "" python speech_server.py
cd ..
timeout /t 2 > nul

:: Verify Speech Server is Running
tasklist | find /i "python.exe" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Speech server failed to start.
    call :cleanup
    exit /b 1
)
exit /b 0

:: Start Vue.js Development Server
:start_vue_server
where yarn >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting Vue.js development server with Yarn...
    start yarn dev
) ELSE (
    echo Yarn not found, checking for npm...
    where npm >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Neither Yarn nor npm is installed. Please install one of them.
        call :cleanup
        exit /b 1
    )
    echo Starting Vue.js development server with npm...
    start npm run dev
)

:: If the server stops, wait before closing
echo Vue.js development server stopped. Press any key to exit.
pause
exit /b 0

:: Cleanup Function
:cleanup
echo Cleaning up processes...
taskkill /f /im python.exe >nul 2>nul
exit /b 0
