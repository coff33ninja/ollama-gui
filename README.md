<p align="center">
  <img src=".github/header.png" alt="Ollama GUI logo">
</p>

<h1 align="center">Ollama GUI</h1>
<p align="center">A modern web interface for chatting with your local LLMs through Ollama</p>

<p align="center">
  <a href="https://ollama.ai">
    <img src="https://img.shields.io/badge/Powered%20by-Ollama-blue?style=flat-square" alt="Powered by Ollama">
  </a>
  <a href="https://github.com/HelgeSverre/ollama-gui/blob/main/LICENSE.md">
    <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License">
  </a>
  <a href="https://ollama-gui.vercel.app">
    <img src="https://img.shields.io/badge/Demo-Live-success?style=flat-square" alt="Live Demo">
  </a>
</p>

## ✨ Features

- 🖥️ Clean, modern interface for interacting with Ollama models
- 💾 Local chat history using IndexedDB
- 📝 Full Markdown support in messages
- 🎙️ Speech-to-Text using Whisper
- 🔊 Text-to-Speech using Bark
- 🌙 Dark mode support
- 🚀 Fast and responsive
- 🔒 Privacy-focused: All processing happens locally

## 🚀 Quick Start

### Prerequisites (only needed for local development)

1. Install [Ollama](https://ollama.ai/download)
2. Install [Node.js](https://nodejs.org/) (v16+) and [Yarn](https://classic.yarnpkg.com/lang/en/docs/install)
3. Install [Python](https://www.python.org/) (3.8+) for the speech server

### Local Development

```bash
# Start Ollama server with your preferred model
ollama pull mistral  # or any other model
ollama serve

# Clone and run the GUI
git clone https://github.com/HelgeSverre/ollama-gui.git
cd ollama-gui
yarn install
yarn dev

# Set up the speech server (in a separate terminal)
cd speech_server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python speech_server.py
```

### Using the Hosted Version

To use the [hosted version](https://ollama-gui.vercel.app), run Ollama with:

```bash
OLLAMA_ORIGINS=https://ollama-gui.vercel.app ollama serve
```

### Docker Deployment

No need to install anything other than `docker`.

> If you have GPU, please uncomment the following lines in the file `compose.yml`
```Dockerfile
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: all
    #           capabilities: [gpu]
```

#### Run
```bash
docker compose up -d

# Access at http://localhost:8080
```

#### Stop
```bash
docker compose down
```

## 🗣️ Speech Features

The GUI includes a dedicated speech server for high-quality voice interactions:

### Speech Server
The `speech_server` directory contains a Flask-based server that handles:
- Speech-to-Text using OpenAI's Whisper
- Text-to-Speech using Suno's Bark
- Automatic model loading and GPU acceleration when available

### Setup
1. Install Python dependencies and start the server:

On Windows:
```bash
cd speech_server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. Start the server:
```bash
python speech_server.py
```

The server runs on http://localhost:5000 and provides:
- POST `/speech-to-text` - Convert audio to text using Whisper
- POST `/text-to-speech` - Convert text to speech using Bark
- GET `/health` - Check server status

### Using Speech Features
- Click the microphone button to start recording (requires server running)
- Click the speaker button on AI messages to hear them
- Speech features are automatically enabled when the server is detected
- Settings can be adjusted in the GUI settings panel

### Requirements
- Python 3.8+
- ~10GB disk space for models
- CUDA-capable GPU recommended but not required
- Microphone for speech input
- Speakers for speech output

## 🛣️ Roadmap

- [x] Chat history with IndexedDB
- [x] Markdown message formatting
- [x] Code cleanup and organization
- [x] Speech-to-Text support
- [x] Text-to-Speech support
- [x] Dedicated speech server
- [ ] Model library browser and installer
- [ ] Mobile-responsive design
- [ ] File uploads with OCR support

## 🛠️ Tech Stack

- [Vue.js](https://vuejs.org/) - Frontend framework
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [VueUse](https://vueuse.org/) - Vue Composition Utilities
- [@tabler/icons-vue](https://github.com/tabler/icons-vue) - Icons
- [Flask](https://flask.palletsprojects.com/) - Speech Server
- [Whisper](https://github.com/openai/whisper) - Speech-to-Text
- [Bark](https://github.com/suno-ai/bark) - Text-to-Speech
- Design inspired by [LangUI](https://www.langui.dev/)
- Hosted on [Vercel](https://vercel.com/)

## 📄 License

Released under the [MIT License](LICENSE.md).

## 🙏 Credits

- Original GUI by [Helge Sverre](https://github.com/HelgeSverre)
- Speech features added by [@coff33ninja](https://github.com/coff33ninja)