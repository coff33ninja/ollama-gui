import express from 'express'
import cors from 'cors'
import speechInstaller from './speechInstaller'

const app = express()
app.use(cors())
app.use(express.json())

// Add the speech installer routes
app.use('/api', speechInstaller)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})