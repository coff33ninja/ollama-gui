# Ollama GUI

A modern web interface for Ollama, featuring chat functionality, system prompts, and speech capabilities.

## Features

- 🤖 Chat interface for Ollama models
- 🎯 System prompts support
- 🎙️ Speech-to-text and text-to-speech capabilities
- 🌓 Dark/Light mode
- 💾 Chat history
- 🔄 Multiple model support

## System Requirements

### Required
- Node.js 18+ and npm
- Python 3.9+ (Python 3.11 recommended)
- Ollama installed and running

### Optional (for Speech Features)
- Microphone (for speech input)
- Speakers (for text-to-speech)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ollama-gui.git
   cd ollama-gui
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install Python and dependencies**

   Windows:
   ```bash
   # Install Python 3.11 using winget
   winget install Python.Python.3.11

   # Install Python dependencies
   pip install flask flask-cors pyttsx3 openai-whisper numpy
   ```

   macOS:
   ```bash
   # Install Python using brew
   brew install python@3.11

   # Install Python dependencies
   pip3 install flask flask-cors pyttsx3 openai-whisper numpy
   ```

   Linux:
   ```bash
   # Install Python and required packages
   sudo apt-get update
   sudo apt-get install -y python3.11 python3-pip portaudio19-dev python3-pyaudio

   # Install Python dependencies
   pip3 install flask flask-cors pyttsx3 openai-whisper numpy
   ```

## Running the Application

1. **Start Ollama**
   Make sure Ollama is running and accessible at `http://localhost:11434`

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Open the application**
   Navigate to `http://localhost:5173` in your web browser

## Troubleshooting

### Python Issues
- Ensure Python 3.9+ is installed: `python --version` or `python3 --version`
- Check pip installation: `pip --version` or `pip3 --version`
- If you see "Python not found", add Python to your system's PATH

### Speech Features
- Make sure your microphone is connected and working
- Allow microphone access when prompted by the browser
- Check if the speech server is running (Status indicator in the UI)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)