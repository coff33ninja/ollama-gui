import { exec, ChildProcess } from 'child_process'
import { Router, Request, Response } from 'express'
import { platform } from 'os'

const router = Router()

// Track running processes
let speechServer: ChildProcess | null = null

// Utility to handle async execution
const execAsync = (command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else {
        resolve(stdout.trim())
      }
    })
  })
}

// Check Python version
router.get('/check-python', async (req: Request, res: Response) => {
  try {
    const stdout = await execAsync('python --version')
    const version = stdout.split(' ')[1]
    const [major, minor] = version.split('.').map(Number)
    
    if (major >= 3 && minor >= 9) {
      res.json({ version, status: 'ok' })
    } else {
      res.status(400).json({ 
        error: 'Incompatible Python version', 
        required: '3.9+', 
        current: `${major}.${minor}` 
      })
    }
  } catch (error) {
    res.status(500).json({ error: 'Python not found' })
  }
})

// Install dependencies
router.post('/install-speech-deps', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain')
  res.setHeader('Transfer-Encoding', 'chunked')

  const os = platform()
  const commands: string[] = getCommandsForPlatform(os)
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

// Start speech server
router.post('/start-speech-server', (req: Request, res: Response) => {
  if (speechServer) {
    return res.status(400).json({ error: 'Speech server is already running' })
  }

  const pythonScript = 'speech_server.py'
  
  speechServer = exec(`python ${pythonScript}`)
  
  speechServer.stdout?.on('data', (data) => {
    console.log(`Speech server stdout: ${data}`)
  })

  speechServer.stderr?.on('data', (data) => {
    console.error(`Speech server stderr: ${data}`)
  })

  speechServer.on('close', (code) => {
    console.log(`Speech server exited with code ${code}`)
    speechServer = null
  })

  res.json({ message: 'Server started', pid: speechServer.pid })
})

// Stop speech server
router.post('/stop-speech-server', (req: Request, res: Response) => {
  if (!speechServer) {
    return res.status(400).json({ error: 'Speech server is not running' })
  }

  speechServer.kill()
  res.json({ message: 'Server stopped' })
})

// Get server status
router.get('/speech-server-status', (req: Request, res: Response) => {
  res.json({
    running: !!speechServer,
    pid: speechServer?.pid
  })
})

// Helper function to get platform-specific commands
function getCommandsForPlatform(os: string): string[] {
  switch (os) {
    case 'win32':
      return [
        'pip install pipwin',
        'pipwin install pyaudio',
        'pip install flask flask-cors pyttsx3 whisper numpy'
      ]
    case 'darwin':
      return [
        'brew install portaudio',
        'pip install pyaudio flask flask-cors pyttsx3 whisper numpy'
      ]
    default:
      return [
        'sudo apt-get install -y portaudio19-dev python3-pyaudio',
        'pip install pyaudio flask flask-cors pyttsx3 whisper numpy'
      ]
  }
}

export default router