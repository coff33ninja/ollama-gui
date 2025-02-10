# Ollama GUI

A web-based GUI for [Ollama](https://ollama.ai/), featuring chat interactions, voice input/output, and model management.

## Features

- 💬 Chat interface with markdown support
- 🎙️ Voice input using Whisper for accurate speech recognition
- 🔊 Text-to-speech output for AI responses
- 🌙 Dark mode support
- 📱 Responsive design
- 🔄 Stream responses in real-time
- 💾 Chat history
- 📝 System prompts
- 🎯 Model parameter adjustment
- 📚 Model library management

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Ollama](https://ollama.ai/) installed and running
- Python 3.9+ for voice features
- Audio input/output devices for voice features

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ollama-gui.git
cd ollama-gui
```

2. Install Node.js dependencies:
```bash
yarn install
```

3. Install Python dependencies for voice features:

Windows:
```bash
# Install PyAudio wheel first (Windows)
pip install pipwin
pipwin install pyaudio

# Install other dependencies
pip install pyttsx3 whisper torch pygame numpy
```

Linux:
```bash
# Install PortAudio development package first
sudo apt-get install portaudio19-dev python3-pyaudio

# Install Python dependencies
pip install pyaudio pyttsx3 whisper torch pygame numpy
```

macOS:
```bash
# Install PortAudio using Homebrew
brew install portaudio

# Install Python dependencies
pip install pyaudio pyttsx3 whisper torch pygame numpy
```

## Usage

1. Start Ollama (if not already running):
```bash
ollama serve
```

2. Start the voice assistant server:
```bash
python voice_assistant.py
```

3. Start the web interface:
```bash
yarn dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Voice Features

The GUI includes advanced voice interaction capabilities:

- **Speech-to-Text**: Hold the microphone button while speaking to convert your voice to text
  - Uses OpenAI's Whisper model for accurate transcription
  - Works offline
  - Supports multiple languages

- **Text-to-Speech**: Click the speaker icon on AI messages to hear them spoken
  - Uses pyttsx3 for offline text-to-speech
  - Supports system voices
  - Visual feedback during playback

## Configuration

### Voice Settings

Voice features can be configured in the settings panel:
- Enable/disable speech-to-text
- Enable/disable text-to-speech
- Select voice for text-to-speech
- Adjust speech recognition language

### Model Parameters

Adjust various model parameters:
- Temperature
- Top P
- Top K
- Context window
- System prompt

## Development

### Project Structure