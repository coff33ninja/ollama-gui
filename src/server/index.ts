import express from 'express'
import cors from 'cors'
import speechInstaller from './speechInstaller'
import systemChecker from './systemChecker'
import { AddressInfo } from 'net'

const app = express()

// Configuration
const config = {
  port: process.env.PORT || 5000,
  corsOptions: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
}

// Middleware
app.use(cors(config.corsOptions))
app.use(express.json())

// Pre-flight requests
app.options('*', cors(config.corsOptions))

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Status endpoint for Ollama
app.get('/status', async (req, res) => {
  try {
    const response = await fetch('http://localhost:11434/api/tags')
    const data = await response.json()
    res.json({ status: 'ok', ollama: true, models: data })
  } catch (error) {
    res.json({ status: 'error', ollama: false, error: (error as Error).message })
  }
})

// Routes
app.use('/api', systemChecker) // Add system checker routes
app.use('/api', speechInstaller)

// Start server
const server = app.listen(config.port, () => {
  const address = server.address() as AddressInfo
  console.log(`Server running on port ${address.port}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
})

export default server