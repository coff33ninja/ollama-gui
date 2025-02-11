#!/bin/bash

echo "Checking Python virtual environment..."

# Check if venv directory exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "Error: Failed to create virtual environment."
        echo "Please ensure Python 3.8+ is installed and available in PATH."
        read -p "Press Enter to exit..."
        exit 1
    fi
fi

# Activate virtual environment
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo "Error: Failed to activate virtual environment."
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if requirements are installed by trying to import key packages
python3 -c "import flask, whisper, transformers" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing requirements..."
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install requirements."
        read -p "Press Enter to exit..."
        exit 1
    fi
fi

echo "Starting speech server..."
python3 speech_server.py

# If server stops, wait before closing
read -p "Press Enter to exit..."