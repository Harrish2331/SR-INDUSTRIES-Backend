import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Setup destination matching
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.resolve(__dirname, '../uploads')
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `drawing-${uniqueSuffix}${ext}`)
  }
})

// Configure format validation checks
const fileFilter = (req, file, cb) => {
  const allowedExts = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.dxf', '.dwg']
  const ext = path.extname(file.originalname).toLowerCase()
  
  if (allowedExts.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error(`Security block: Unapproved file type extension (${ext}).`), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 Megabytes cap
  }
})

export default upload
