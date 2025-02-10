@echo off
echo Starting Ollama...
start cmd /k "ollama serve"
echo Waiting for Ollama to initialize...

powershell -ExecutionPolicy Bypass -File "%~dp0check_ollama.ps1"
if errorlevel 1 (
    echo Failed to start Ollama. Please check if it's installed correctly.
    exit /b 1
)

echo Starting Flask server...
start cmd /k "cd /d %~dp0 && python speech_server.py"
echo Waiting for Flask server to initialize...
timeout /t 3 /nobreak

echo Starting Vite development server...
npm run dev