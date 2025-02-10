import { exec } from 'child_process'
import { Router } from 'express'
import { platform } from 'os'

const router = Router()

router.get('/check-python', (req, res) => {
  exec('python --version', (error, stdout, stderr) => {
    if (error) {
      res.status(500).json({ error: 'Python not found' })
      return
    }
    
    // Check Python version
    const version = stdout.trim().split(' ')[1]
    const [major, minor] = version.split('.').map(Number)
    
    if (major >= 3 && minor >= 9) {
      res.json({ version })
    } else {
      res.status(500).json({ error: 'Python 3.9+ required' })
    }
  })
})

router.post('/install-speech-deps', (req, res) => {
  res.setHeader('Content-Type', 'text/plain')
  res.setHeader('Transfer-Encoding', 'chunked')

  const os = platform()
  let commands: string[] = []

  if (os === 'win32') {
    commands = [
      'pip install pipwin',
      'pipwin install pyaudio',
      'pip install flask flask-cors pyttsx3 whisper numpy'
    ]
  } else if (os === 'darwin') {
    commands = [
      'brew install portaudio',
      'pip install pyaudio flask flask-cors pyttsx3 whisper numpy'
    ]
  } else {
    commands = [
      'sudo apt-get install -y portaudio19-dev python3-pyaudio',
      'pip install pyaudio flask flask-cors pyttsx3 whisper numpy'
    ]
  }

  let currentCommand = 0

  const runCommand = () => {
    if (currentCommand >= commands.length) {
      res.end('\nInstallation completed!')
      return
    }

    const command = commands[currentCommand]
    res.write(`\nRunning: ${command}\n`)

    exec(command, (error, stdout, stderr) => {
      if (error) {
        res.write(`Error: ${error.message}\n`)
        res.end('Installation failed!')
        return
      }

      if (stdout) res.write(stdout)
      if (stderr) res.write(stderr)

      currentCommand++
      runCommand()
    })
  }

  runCommand()
})

router.post('/start-speech-server', (req, res) => {
  const pythonScript = 'speech_server.py'
  
  exec(`python ${pythonScript}`, (error, stdout, stderr) => {
    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.json({ message: 'Server started' })
  })
})

export default router