import { Router, Request, Response } from 'express'
import { exec } from 'child_process'
import { platform } from 'os'
import { promisify } from 'util'

const execAsync = promisify(exec)
const router = Router()

interface SystemRequirement {
  name: string
  checkCommand: string
  installCommand: string
  expectedVersion?: string
  isOptional?: boolean
}

const getSystemRequirements = (): SystemRequirement[] => {
  const os = platform()
  
  if (os === 'win32') {
    return [
      {
        name: 'Python',
        checkCommand: 'python --version',
        installCommand: 'winget install Python.Python.3.11',
        expectedVersion: '3.9'
      },
      {
        name: 'pip',
        checkCommand: 'pip --version',
        installCommand: 'python -m ensurepip --upgrade',
        isOptional: true
      }
    ]
  } else if (os === 'darwin') {
    return [
      {
        name: 'Python',
        checkCommand: 'python3 --version',
        installCommand: 'brew install python@3.11',
        expectedVersion: '3.9'
      },
      {
        name: 'pip',
        checkCommand: 'pip3 --version',
        installCommand: 'python3 -m ensurepip --upgrade',
        isOptional: true
      }
    ]
  } else {
    // Linux
    return [
      {
        name: 'Python',
        checkCommand: 'python3 --version',
        installCommand: 'sudo apt-get update && sudo apt-get install -y python3.11',
        expectedVersion: '3.9'
      },
      {
        name: 'pip',
        checkCommand: 'pip3 --version',
        installCommand: 'sudo apt-get install -y python3-pip',
        isOptional: true
      }
    ]
  }
}

// Check system requirements
router.get('/check-system', async (req: Request, res: Response) => {
  const requirements = getSystemRequirements()
  const results = []

  for (const req of requirements) {
    try {
      const { stdout } = await execAsync(req.checkCommand)
      const version = stdout.trim()
      
      if (req.expectedVersion) {
        const currentVersion = version.match(/\d+\.\d+/)?.[0] || '0.0'
        const isVersionOk = parseFloat(currentVersion) >= parseFloat(req.expectedVersion)
        
        results.push({
          name: req.name,
          installed: true,
          version,
          meetsRequirement: isVersionOk,
          required: !req.isOptional
        })
      } else {
        results.push({
          name: req.name,
          installed: true,
          version,
          meetsRequirement: true,
          required: !req.isOptional
        })
      }
    } catch (error) {
      results.push({
        name: req.name,
        installed: false,
        error: (error as Error).message,
        required: !req.isOptional
      })
    }
  }

  res.json({ results })
})

// Install missing requirements
router.post('/install-system-requirement', async (req: Request, res: Response) => {
  const { name } = req.body
  
  if (!name) {
    return res.status(400).json({ error: 'Requirement name is required' })
  }

  const requirements = getSystemRequirements()
  const requirement = requirements.find(r => r.name === name)

  if (!requirement) {
    return res.status(404).json({ error: 'Requirement not found' })
  }

  res.setHeader('Content-Type', 'text/plain')
  res.setHeader('Transfer-Encoding', 'chunked')

  try {
    res.write(`Installing ${name}...\n`)
    const { stdout, stderr } = await execAsync(requirement.installCommand)
    
    if (stdout) res.write(stdout + '\n')
    if (stderr) res.write(stderr + '\n')

    // Verify installation
    try {
      await execAsync(requirement.checkCommand)
      res.write(`${name} installed successfully!\n`)
      res.end()
    } catch (error) {
      res.write(`Installation completed but verification failed: ${(error as Error).message}\n`)
      res.end()
    }
  } catch (error) {
    res.write(`Installation failed: ${(error as Error).message}\n`)
    res.end()
  }
})

export default router