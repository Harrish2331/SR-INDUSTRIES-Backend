import express from 'express'
import { submitContactForm, getAllInquiries, deleteInquiry } from '../controllers/contactController.js'
import { contactValidationRules, validate } from '../middleware/validator.js'
import { contactRateLimiter } from '../middleware/rateLimiter.js'
import upload from '../middleware/upload.js'
import {
  adminLogin,
  checkAdminAuth,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/projectController.js'
import projectUpload from '../middleware/projectUpload.js'

const router = express.Router()

// Custom file upload handling middleware wrapper for contact form
const parseAttachment = (req, res, next) => {
  upload.single('attachment')(req, res, (err) => {
    if (err) {
      console.warn('⚠️ Multer File Error captured:', err.message)
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload constraints breached.'
      })
    }
    next()
  })
}

// Custom multiple image upload handling middleware wrapper for projects
const parseProjectImages = (req, res, next) => {
  projectUpload.array('images', 10)(req, res, (err) => {
    if (err) {
      console.warn('⚠️ Multer Project Images Error captured:', err.message)
      return res.status(400).json({
        success: false,
        message: err.message || 'Image upload constraints breached.'
      })
    }
    next()
  })
}

// Contact submission endpoint mapping
router.post('/contact', contactRateLimiter, parseAttachment, contactValidationRules, validate, submitContactForm)

// Administrator login
router.post('/admin/login', adminLogin)

// Public project showcase endpoints
router.get('/projects', getAllProjects)
router.get('/projects/:id', getProjectById)

// Protected administrator endpoints
router.post('/projects', checkAdminAuth, parseProjectImages, createProject)
router.put('/projects/:id', checkAdminAuth, parseProjectImages, updateProject)
router.delete('/projects/:id', checkAdminAuth, deleteProject)
router.get('/admin/contacts', checkAdminAuth, getAllInquiries)
router.delete('/admin/contacts/:id', checkAdminAuth, deleteInquiry)

export default router
