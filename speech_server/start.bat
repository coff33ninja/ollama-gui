@echo off
setlocal enabledelayedexpansion

echo Checking Python virtual environment...

REM Check if venv directory exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    if !errorlevel! neq 0 (
        echo Error: Failed to create virtual environment.
        echo Please ensure Python 3.8+ is installed and available in PATH.
        pause
        exit /b 1
    )
)

REM Activate virtual environment
call venv\Scripts\activate
if !errorlevel! neq 0 (
    echo Error: Failed to activate virtual environment.
    pause
    exit /b 1
)

REM Check if requirements are installed by trying to import key packages
python -c "import flask, whisper, transformers" 2>nul
if !errorlevel! neq 0 (
    echo Installing requirements...
    pip install -r requirements.txt
    if !errorlevel! neq 0 (
        echo Error: Failed to install requirements.
        pause
        exit /b 1
    )
)

echo Starting speech server...
python speech_server.py

REM If server stops, wait before closing
pause