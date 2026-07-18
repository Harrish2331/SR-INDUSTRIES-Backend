import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import dotenv from 'dotenv'
import apiRoutes from './routes/api.js'
import { connectDB } from './config/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment configurations
dotenv.config({ path: path.join(__dirname, '.env') })

// Establish database connection (with JSON file fallback built-in)
connectDB()

const app = express()
const PORT = process.env.PORT || 5000

// Create uploads folder if not exists
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// 1. Logging Middleware
app.use(morgan('dev'))

// 2. Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: false, // Turn off CSP so default assets do not block
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
)

// 3. CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true)
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.'
        return callback(new Error(msg), false)
      }
      return callback(null, true)
    },
    credentials: true
  })
)

// 4. Request Body Parsers & Compression
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 5. Serve Uploaded files statically
app.use('/uploads', express.static(uploadsDir))

// 6. Register Routes
app.use('/api', apiRoutes)

// 7. Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// 8. Global Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER_ERROR:', err.message || err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  })
})

// Start listening
app.listen(PORT, () => {
  console.log(`⚡ S R Industries backend active on http://localhost:${PORT}`)
})
