@echo off
setlocal enabledelayedexpansion

echo Checking Node.js dependencies...

REM === Ensure Node.js dependencies are installed ===
if not exist node_modules (
    echo Installing Node.js dependencies...

    where yarn >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo Yarn detected. Running "yarn install"...
        call yarn install
        if !errorlevel! NEQ 0 (
            echo Warning: Yarn install failed. Trying npm...
            where npm >nul 2>nul
            if %ERRORLEVEL% NEQ 0 (
                echo Error: Neither Yarn nor npm is installed. Please install one of them.
                pause
                exit /b 1
            )
            echo Running "npm install" instead...
            call npm install
            if !errorlevel! NEQ 0 (
                echo Error: Failed to install dependencies with both Yarn and npm.
                pause
                exit /b 1
            )
        )
    ) ELSE (
        echo Yarn not found. Checking for npm...
        where npm >nul 2>nul
        if %ERRORLEVEL% NEQ 0 (
            echo Error: Neither Yarn nor npm is installed. Please install one of them.
            pause
            exit /b 1
        )
        echo Running "npm install"...
        call npm install
        if !errorlevel! NEQ 0 (
            echo Error: Failed to install Node.js dependencies.
            pause
            exit /b 1
        )
    )
)

REM === Ensure Python Virtual Environment Exists ===
if not exist "venv\Scripts\activate.bat" (
    echo Virtual environment not found. Creating one...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo Virtual environment created successfully.
)

REM === Activate Virtual Environment ===
echo Activating Python virtual environment...
call venv\Scripts\activate.bat
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to activate virtual environment.
    pause
    exit /b 1
)

REM === Install Required Python Packages ===
if exist "requirements.txt" (
    echo Installing required Python packages...
    pip install -r requirements.txt
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to install required Python packages.
        pause
        exit /b 1
    )
) ELSE (
    echo Warning: requirements.txt not found. Skipping package installation.
)

REM === Start Speech Server ===
echo Starting speech server...
start "Speech Server" cmd /k "cd /d speech_server && call start.bat"

REM Wait for the speech server to initialize
timeout /t 2 > nul

REM Check if the speech server started
tasklist | find /i "python.exe" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Speech server failed to start.
    pause
    exit /b 1
)

REM === Start Vue.js Development Server ===
where yarn >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Yarn not found, checking for npm...
    where npm >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Neither Yarn nor npm is installed. Please install one of them.
        pause
        exit /b 1
    )
    echo Starting Vue.js development server with npm...
    call npm run dev
) ELSE (
    echo Starting Vue.js development server with Yarn...
    call yarn dev
)

REM If the server stops, wait before closing
echo Vue.js development server stopped. Press any key to exit.
pause
