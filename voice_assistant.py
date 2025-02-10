import pyttsx3
import numpy as np
import whisper
import pyaudio
import sys
import torch
import requests
import json
import yaml
import wave
from yaml import Loader
import pygame
import pygame.locals

BACK_COLOR = (0,0,0)
REC_COLOR = (255,0,0)
TEXT_COLOR = (255,255,255)
REC_SIZE = 80
FONT_SIZE = 24
WIDTH = 320
HEIGHT = 240
KWIDTH = 20
KHEIGHT = 6
MAX_TEXT_LEN_DISPLAY = 32

INPUT_DEFAULT_DURATION_SECONDS = 5
INPUT_FORMAT = pyaudio.paInt16
INPUT_CHANNELS = 1
INPUT_RATE = 16000
INPUT_CHUNK = 1024
OLLAMA_REST_HEADERS = {'Content-Type': 'application/json',}

class Assistant:
    def __init__(self):
        # Initialize PyGame
        pygame.init()
        self.clock = pygame.time.Clock()
        pygame.display.set_caption("Voice Assistant")

        self.windowSurface = pygame.display.set_mode((WIDTH, HEIGHT), 0, 32)
        self.font = pygame.font.SysFont(None, FONT_SIZE)

        # Initialize audio
        self.audio = pyaudio.PyAudio()
        self.tts = pyttsx3.init()

        # Test audio input
        try:
            self.audio.open(format=INPUT_FORMAT, 
                          channels=INPUT_CHANNELS,
                          rate=INPUT_RATE, 
                          input=True,
                          frames_per_buffer=INPUT_CHUNK).close()
        except:
            self.wait_exit()

        # Load Whisper model
        self.display_message("Loading Whisper model...")
        self.model = whisper.load_model("base")
        
        self.context = []
        self.display_message("Press Space to speak")

    def wait_exit(self):
        while True:
            self.display_message("Error: No audio input available")
            self.clock.tick(60)
            for event in pygame.event.get():
                if event.type == pygame.locals.QUIT:
                    self.shutdown()

    def shutdown(self):
        self.audio.terminate()
        pygame.quit()
        sys.exit()

    def display_rec_start(self):
        self.windowSurface.fill(BACK_COLOR)
        pygame.draw.circle(self.windowSurface, REC_COLOR, (WIDTH//2, HEIGHT//2), REC_SIZE)
        pygame.display.flip()

    def display_sound_energy(self, energy):
        COL_COUNT = 5
        RED_CENTER = 150
        FACTOR = 10
        MAX_AMPLITUDE = 100

        self.windowSurface.fill(BACK_COLOR)
        amplitude = int(MAX_AMPLITUDE * energy)
        hspace, vspace = 2*KWIDTH, int(KHEIGHT/2)
        
        def rect_coords(x, y):
            return (int(x-KWIDTH/2), int(y-KHEIGHT/2), KWIDTH, KHEIGHT)
            
        for i in range(-int(np.floor(COL_COUNT/2)), int(np.ceil(COL_COUNT/2))):
            x, y, count = WIDTH/2+(i*hspace), HEIGHT/2, amplitude-2*abs(i)    
            
            mid = int(np.ceil(count/2))
            for j in range(0, mid):
                color = (RED_CENTER+(FACTOR*(j % mid)), 0, 0)
                offset = j*(KHEIGHT+vspace)
                pygame.draw.rect(self.windowSurface, color, rect_coords(x, y+offset))
                pygame.draw.rect(self.windowSurface, color, rect_coords(x, y-offset))
        
        pygame.display.flip()

    def display_message(self, text):
        self.windowSurface.fill(BACK_COLOR)
        
        label = self.font.render(
            text if len(text) < MAX_TEXT_LEN_DISPLAY else (text[0:MAX_TEXT_LEN_DISPLAY]+"..."), 
            1, 
            TEXT_COLOR
        )
        
        size = label.get_rect()[2:4]
        self.windowSurface.blit(label, (WIDTH/2 - size[0]/2, HEIGHT/2 - size[1]/2))
        pygame.display.flip()

    def waveform_from_mic(self, key=pygame.K_SPACE) -> np.ndarray:
        self.display_rec_start()

        stream = self.audio.open(
            format=INPUT_FORMAT, 
            channels=INPUT_CHANNELS,
            rate=INPUT_RATE, 
            input=True,
            frames_per_buffer=INPUT_CHUNK
        )
        
        frames = []

        while True:            
            pygame.event.pump()  # process event queue
            pressed = pygame.key.get_pressed()
            if pressed[key]:
                data = stream.read(INPUT_CHUNK)
                frames.append(data)
            else:
                break

        stream.stop_stream()
        stream.close()

        return np.frombuffer(b''.join(frames), np.int16).astype(np.float32) * (1 / 32768.0)

    def speech_to_text(self, waveform):
        self.display_message("Processing speech...")
        transcript = self.model.transcribe(waveform, fp16=torch.cuda.is_available())
        text = transcript["text"]
        self.display_message(text)
        return text

    def ask_ollama(self, prompt, responseCallback):
        jsonParam = {
            "model": "mistral",
            "stream": True,
            "context": self.context,
            "prompt": prompt
        }
        
        response = requests.post(
            "http://localhost:11434/api/generate",
            json=jsonParam,
            headers=OLLAMA_REST_HEADERS,
            stream=True
        )
        response.raise_for_status()

        self.display_message("Thinking...")

        tokens = []
        for line in response.iter_lines():
            body = json.loads(line)
            token = body.get('response', '')
            tokens.append(token)
            
            if token in [".", ":", "!", "?"]:
                current_response = "".join(tokens)
                responseCallback(current_response)
                tokens = []

            if 'error' in body:
                responseCallback("Error: " + body['error'])

            if body.get('done', False):
                self.context = body['context']
                if tokens:  # Process any remaining tokens
                    responseCallback("".join(tokens))

    def text_to_speech(self, text):
        print(text)
        tempPath = 'temp.wav'
        self.tts.save_to_file(text, tempPath)
        self.tts.runAndWait()
        
        wf = wave.open(tempPath, 'rb')
        stream = self.audio.open(
            format=self.audio.get_format_from_width(wf.getsampwidth()),
            channels=wf.getnchannels(),
            rate=wf.getframerate(),
            output=True
        )
        
        chunkSize = 1024
        chunk = wf.readframes(chunkSize)
        while chunk:
            stream.write(chunk)
            tmp = np.array(np.frombuffer(chunk, np.int16), np.float32) * (1 / 32768.0)
            energy_of_chunk = np.sqrt(np.mean(tmp**2))
            self.display_sound_energy(energy_of_chunk)
            chunk = wf.readframes(chunkSize)

        wf.close()    
        self.display_message(text)

def main():
    pygame.init()
    ass = Assistant()
    push_to_talk_key = pygame.K_SPACE

    while True:
        ass.clock.tick(60)
        for event in pygame.event.get():
            if event.type == pygame.KEYDOWN and event.key == push_to_talk_key:
                speech = ass.waveform_from_mic(push_to_talk_key)
                transcription = ass.speech_to_text(waveform=speech)
                ass.ask_ollama(transcription, ass.text_to_speech)
                ass.display_message("Press Space to speak")

            if event.type == pygame.locals.QUIT:
                ass.shutdown()

if __name__ == "__main__":
    main()