export class AudioProcessor {
  private audioContext: AudioContext
  private analyser: AnalyserNode
  private gainNode: GainNode
  private silenceThreshold: number = 0.01
  private silenceDuration: number = 0.25 // seconds

  constructor() {
    this.audioContext = new AudioContext()
    this.analyser = this.audioContext.createAnalyser()
    this.gainNode = this.audioContext.createGain()
    
    this.analyser.fftSize = 2048
    this.gainNode.connect(this.audioContext.destination)
    this.analyser.connect(this.gainNode)
  }

  async createSilence(durationSecs: number = 0.25): Promise<AudioBuffer> {
    const sampleRate = this.audioContext.sampleRate
    const length = Math.floor(sampleRate * durationSecs)
    return this.audioContext.createBuffer(1, length, sampleRate)
  }

  async concatenateAudioBuffers(buffers: AudioBuffer[]): Promise<AudioBuffer> {
    const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0)
    const result = this.audioContext.createBuffer(
      1,
      totalLength,
      this.audioContext.sampleRate
    )
    
    let offset = 0
    for (const buffer of buffers) {
      result.copyToChannel(buffer.getChannelData(0), 0, offset)
      offset += buffer.length
    }
    
    return result
  }

  async playAudio(buffer: AudioBuffer): Promise<void> {
    const source = this.audioContext.createBufferSource()
    source.buffer = buffer
    source.connect(this.gainNode)
    
    return new Promise((resolve) => {
      source.onended = () => resolve()
      source.start(0)
    })
  }

  async arrayBufferToAudioBuffer(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    return await this.audioContext.decodeAudioData(arrayBuffer)
  }

  setVolume(value: number) {
    this.gainNode.gain.value = Math.max(0, Math.min(1, value))
  }

  async normalizeAudio(buffer: AudioBuffer): Promise<AudioBuffer> {
    const channelData = buffer.getChannelData(0)
    const maxAmplitude = Math.max(...channelData.map(Math.abs))
    
    if (maxAmplitude > 0) {
      const normalizedBuffer = this.audioContext.createBuffer(1, buffer.length, buffer.sampleRate)
      const normalizedData = normalizedBuffer.getChannelData(0)
      
      for (let i = 0; i < channelData.length; i++) {
        normalizedData[i] = channelData[i] / maxAmplitude * 0.9 // Leave some headroom
      }
      
      return normalizedBuffer
    }
    
    return buffer
  }
}