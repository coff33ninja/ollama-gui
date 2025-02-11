@echo off
setlocal enabledelayedexpansion

echo Checking Python virtual environment...

REM Check if venv directory exists
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

REM Activate virtual environment
call venv\Scripts\activate.bat
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to activate virtual environment.
    pause
    exit /b 1
)
echo Virtual environment activated successfully.

REM Install requirements if they exist
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

echo Starting speech server...
python speech_server.py

REM If server stops, wait before closing
pause