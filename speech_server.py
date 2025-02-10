from flask import Flask, request, send_file
import pyttsx3
import whisper
import tempfile
import os
from flask_cors import CORS
import numpy as np
import wave
import io

app = Flask(__name__)
CORS(app)

# Initialize TTS engine
tts_engine = pyttsx3.init()

# Initialize Whisper model
print("Loading Whisper model...")
whisper_model = whisper.load_model("base")
print("Whisper model loaded!")

@app.route('/text-to-speech', methods=['POST'])
def text_to_speech():
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return {'error': 'No text provided'}, 400

        # Create a temporary file for the audio
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            temp_path = temp_file.name
            
        # Generate speech
        tts_engine.save_to_file(text, temp_path)
        tts_engine.runAndWait()
        
        # Send the file
        return send_file(
            temp_path,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='speech.wav'
        )
    
    except Exception as e:
        return {'error': str(e)}, 500
    
    finally:
        # Clean up the temporary file
        if 'temp_path' in locals():
            try:
                os.unlink(temp_path)
            except:
                pass

@app.route('/speech-to-text', methods=['POST'])
def speech_to_text():
    try:
        if 'audio' not in request.files:
            return {'error': 'No audio file provided'}, 400
        
        audio_file = request.files['audio']
        
        # Convert the audio file to wav format
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            temp_path = temp_file.name
            audio_file.save(temp_path)
            
        # Transcribe using Whisper
        result = whisper_model.transcribe(temp_path)
        text = result["text"].strip()
        
        return {'text': text}
    
    except Exception as e:
        return {'error': str(e)}, 500
    
    finally:
        # Clean up the temporary file
        if 'temp_path' in locals():
            try:
                os.unlink(temp_path)
            except:
                pass

@app.route('/voices', methods=['GET'])
def get_voices():
    voices = tts_engine.getProperty('voices')
    voice_list = [
        {
            'name': voice.name,
            'id': voice.id,
            'languages': voice.languages,
            'gender': voice.gender
        }
        for voice in voices
    ]
    return {'voices': voice_list}

@app.route('/health', methods=['GET'])
def health_check():
    return {'status': 'ok'}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)