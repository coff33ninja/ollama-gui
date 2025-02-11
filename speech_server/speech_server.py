from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import whisper
import torch
import nltk
import numpy as np
from transformers import AutoProcessor, BarkModel
import io
import soundfile as sf
import json

app = Flask(__name__)
CORS(app)

# Initialize models
stt_model = whisper.load_model("base.en")
tts_model = BarkModel.from_pretrained("suno/bark-small")
tts_processor = AutoProcessor.from_pretrained("suno/bark-small")

device = "cuda" if torch.cuda.is_available() else "cpu"
tts_model.to(device)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

@app.route('/speech-to-text', methods=['POST'])
def speech_to_text():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file"}), 400
    
    audio_file = request.files['audio']
    audio_data = audio_file.read()
    
    # Convert audio to numpy array
    audio_np = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
    
    # Transcribe
    result = stt_model.transcribe(audio_np, fp16=False)
    
    return jsonify({
        "text": result["text"].strip(),
        "confidence": result.get("confidence", None),
        "language": result.get("language", None)
    })

@app.route('/text-to-speech', methods=['POST'])
def text_to_speech():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400

    text = data['text']
    voice_preset = data.get('voice', 'v2/en_speaker_1')
    
    # Process text
    inputs = tts_processor(text, voice_preset=voice_preset, return_tensors="pt")
    inputs = {k: v.to(device) for k, v in inputs.items()}

    # Generate speech
    with torch.no_grad():
        audio_array = tts_model.generate(**inputs, pad_token_id=10000)
        
    audio_array = audio_array.cpu().numpy().squeeze()
    
    # Convert to WAV format
    bytes_io = io.BytesIO()
    sf.write(bytes_io, audio_array, tts_model.generation_config.sample_rate, format='WAV')
    bytes_io.seek(0)
    
    return send_file(
        bytes_io,
        mimetype='audio/wav',
        as_attachment=True,
        download_name='speech.wav',
        headers={
            'X-Audio-Metadata': json.dumps({
                'duration': len(audio_array) / tts_model.generation_config.sample_rate,
                'sampleRate': tts_model.generation_config.sample_rate,
                'format': 'wav'
            })
        }
    )

if __name__ == '__main__':
    app.run(port=5000)