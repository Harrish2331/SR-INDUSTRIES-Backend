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

// ── Startup Environment Validation ──────────────────────────────────────────
const REQUIRED_ENV_VARS = ['SMTP_USER', 'SMTP_PASS', 'ADMIN_EMAIL']
const OPTIONAL_ENV_VARS = ['CLIENT_URL', 'MONGODB_URI', 'ADMIN_PASSWORD']

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  S R Industries — Backend Environment Check')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
REQUIRED_ENV_VARS.forEach(key => {
  if (process.env[key]) {
    console.log(`  ✅ ${key}: SET`)
  } else {
    console.warn(`  ❌ ${key}: MISSING — this feature will not work correctly`)
  }
})
OPTIONAL_ENV_VARS.forEach(key => {
  console.log(`  ${process.env[key] ? '✅' : '⚠️ '} ${key}: ${process.env[key] ? 'SET' : 'not set (using default)'}`)
})
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// Establish database connection (with JSON file fallback built-in)
connectDB()

const app = express()
const PORT = process.env.PORT || 5000

// ── Trust Proxy ──────────────────────────────────────────────────────────────
// Required on Render (and any reverse-proxy host) so that express-rate-limit
// correctly reads the real client IP from X-Forwarded-For instead of the
// proxy's internal IP. Without this, rate limiting silently breaks.
app.set('trust proxy', 1)

// Create uploads folder if not exists
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// ── 1. Logging Middleware ────────────────────────────────────────────────────
app.use(morgan('dev'))

// ── 2. Security Headers ──────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
)

// ── 3. CORS Configuration ────────────────────────────────────────────────────
// Explicitly allowed origins (exact-match list)
const ALLOWED_ORIGINS_EXACT = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
  'https://sr-industries.vercel.app', // Production domain
  'https://sr-industries-djsq.vercel.app' // Specific preview/deploy URL from your screenshot
].filter(Boolean)

// Add CLIENT_URL from environment (the deployed Vercel frontend URL)
if (process.env.CLIENT_URL) {
  ALLOWED_ORIGINS_EXACT.push(process.env.CLIENT_URL.trim())
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server calls and curl (no origin header)
    if (!origin) return callback(null, true)

    // Exact match check
    if (ALLOWED_ORIGINS_EXACT.includes(origin)) {
      return callback(null, true)
    }

    // Pattern match: allow ALL *.vercel.app deployments (preview + production)
    // and *.onrender.com so the admin dashboard on any Vercel preview works
    const isVercel = /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)
    const isRender = /^https:\/\/[a-zA-Z0-9-]+\.onrender\.com$/.test(origin)

    if (isVercel || isRender) {
      return callback(null, true)
    }

    console.warn(`🚫 CORS blocked request from origin: ${origin}`)
    return callback(new Error(`CORS policy: origin '${origin}' is not permitted.`), false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token'],
  optionsSuccessStatus: 200 // Legacy browser compatibility (IE11)
}

app.use(cors(corsOptions))

// Explicitly handle preflight OPTIONS for all routes
app.options('*', cors(corsOptions))

// ── 4. Request Body Parsers & Compression ────────────────────────────────────
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ── 5. Serve Uploaded Files Statically ──────────────────────────────────────
app.use('/uploads', express.static(uploadsDir))

// ── 6. Root Health Check (Render & uptime monitors) ─────────────────────────
// This is the PRIMARY health check endpoint.
// Render dashboard should be configured to ping: GET /health
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

// ── 7. Register API Routes ───────────────────────────────────────────────────
app.use('/api', apiRoutes)

// ── 8. Extended Health Check (internal diagnostics) ─────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: {
      node: process.version,
      smtp: !!process.env.SMTP_USER,
      db: !!process.env.MONGODB_URI
    }
  })
})

// ── 9. 404 Handler for Unknown Routes ───────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  })
})

// ── 10. Global Error Handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // CORS errors
  if (err.message && err.message.startsWith('CORS policy')) {
    return res.status(403).json({
      success: false,
      message: err.message
    })
  }

  console.error('SERVER_ERROR:', err.message || err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  })
})

// ── Start Listening ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`⚡ S R Industries backend active on http://localhost:${PORT}`)
  console.log(`   Health check: http://localhost:${PORT}/health`)
  console.log(`   API routes:   http://localhost:${PORT}/api/\n`)
})
