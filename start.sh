#!/bin/bash

echo "Checking Node.js dependencies..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    yarn install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install Node.js dependencies."
        echo "Please ensure Node.js and Yarn are installed and available in PATH."
        read -p "Press Enter to exit..."
        exit 1
    fi
fi

# Start the speech server in the background
echo "Starting speech server..."
cd speech_server
chmod +x start.sh
./start.sh &
SPEECH_PID=$!
cd ..

# Wait a moment for the speech server to initialize
sleep 2

# Start the Vue.js development server
echo "Starting Vue.js development server..."
yarn dev &
VUE_PID=$!

# Function to cleanup background processes
cleanup() {
    echo "Stopping servers..."
    kill $SPEECH_PID 2>/dev/null
    kill $VUE_PID 2>/dev/null
    exit 0
}

# Setup cleanup on script termination
trap cleanup SIGINT SIGTERM

# Wait for either process to exit
wait $SPEECH_PID $VUE_PID

# Cleanup remaining processes
cleanup