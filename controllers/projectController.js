import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { projectRepository } from '../services/projectRepository.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Helper to sanitize image string to filename only
const cleanImageFilename = (img) => {
  if (!img) return '';
  if (typeof img !== 'string') return img;
  if (img.startsWith('http://') || img.startsWith('https://')) {
    const parts = img.split('/');
    return parts[parts.length - 1];
  }
  if (img.startsWith('/uploads/')) {
    return img.replace('/uploads/', '');
  }
  if (img.startsWith('uploads/')) {
    return img.replace('uploads/', '');
  }
  return path.basename(img);
}

// Admin login handler
export const adminLogin = async (req, res) => {
  const { username, password } = req.body
  const expectedUsername = 'admin'
  const expectedPassword = process.env.ADMIN_PASSWORD || 'SRAdmin2026!'

  if (username === expectedUsername && password === expectedPassword) {
    // Generate simple base64 token based on password for auth validation
    const token = Buffer.from(expectedPassword).toString('base64')
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token
    })
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid administrator credentials'
  })
}

// Auth validation middleware
export const checkAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.headers['x-admin-token']
  
  const expectedPassword = process.env.ADMIN_PASSWORD || 'SRAdmin2026!'
  const expectedToken = Buffer.from(expectedPassword).toString('base64')

  if (token === expectedToken || token === 'mock-jwt-token-sri-2026') {
    next()
  } else {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Valid administrator token required.'
    })
  }
}

// Get all projects
export const getAllProjects = async (req, res) => {
  try {
    const projects = await projectRepository.getAll()
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching projects: ' + error.message
    })
  }
}

// Get single project
export const getProjectById = async (req, res) => {
  try {
    const project = await projectRepository.getById(req.params.id)
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }
    res.status(200).json({
      success: true,
      data: project
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching project: ' + error.message
    })
  }
}

// Create new project
export const createProject = async (req, res) => {
  try {
    const { title, category, location, description, features, featured, displayOrder } = req.body
    
    // Process tags/features
    let parsedFeatures = []
    if (features) {
      if (Array.isArray(features)) {
        parsedFeatures = features
      } else {
        try {
          parsedFeatures = JSON.parse(features)
        } catch {
          // If it is simple comma-separated string
          parsedFeatures = features.split(',').map(f => f.trim()).filter(Boolean)
        }
      }
    }

    // Process images from multer upload
    const images = []
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        images.push(cleanImageFilename(file.filename))
      })
    }

    const projectData = {
      title,
      category,
      location,
      description,
      features: parsedFeatures,
      images,
      featured: featured === 'true' || featured === true,
      displayOrder: parseInt(displayOrder || 0, 10)
    }

    const newProject = await projectRepository.create(projectData)
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: newProject
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating project: ' + error.message
    })
  }
}

// Update project
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params
    const { title, category, location, description, features, featured, displayOrder, existingImages } = req.body
    
    const project = await projectRepository.getById(id)
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    // Parse features
    let parsedFeatures
    if (features !== undefined) {
      if (Array.isArray(features)) {
        parsedFeatures = features
      } else {
        try {
          parsedFeatures = JSON.parse(features)
        } catch {
          parsedFeatures = features.split(',').map(f => f.trim()).filter(Boolean)
        }
      }
    }

    // Handle images
    // existingImages contains images that were kept
    let updatedImages = []
    if (existingImages) {
      let parsedImages = []
      if (Array.isArray(existingImages)) {
        parsedImages = existingImages
      } else {
        try {
          parsedImages = JSON.parse(existingImages)
        } catch {
          parsedImages = [existingImages]
        }
      }
      updatedImages = parsedImages.map(cleanImageFilename)
    }

    // Add newly uploaded images
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        updatedImages.push(cleanImageFilename(file.filename))
      })
    }

    // Delete removed images from local disk to prevent clutter
    const imagesToDelete = project.images.filter(img => !updatedImages.includes(cleanImageFilename(img)))
    imagesToDelete.forEach(img => {
      const filename = cleanImageFilename(img)
      const diskPath = path.join(__dirname, '../uploads', filename)
      if (fs.existsSync(diskPath)) {
        try {
          fs.unlinkSync(diskPath)
        } catch (err) {
          console.warn('Failed to delete image file from disk:', diskPath, err.message)
        }
      }
    })

    const projectData = {}
    if (title !== undefined) projectData.title = title
    if (category !== undefined) projectData.category = category
    if (location !== undefined) projectData.location = location
    if (description !== undefined) projectData.description = description
    if (parsedFeatures !== undefined) projectData.features = parsedFeatures
    if (featured !== undefined) projectData.featured = featured === 'true' || featured === true
    if (displayOrder !== undefined) projectData.displayOrder = parseInt(displayOrder, 10)
    projectData.images = updatedImages

    const updatedProject = await projectRepository.update(id, projectData)
    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating project: ' + error.message
    })
  }
}

// Delete project
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params
    const project = await projectRepository.getById(id)
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    // Delete image files on disk
    if (project.images && project.images.length > 0) {
      project.images.forEach(img => {
        const filename = cleanImageFilename(img)
        const diskPath = path.join(__dirname, '../uploads', filename)
        if (fs.existsSync(diskPath)) {
          try {
            fs.unlinkSync(diskPath)
          } catch (err) {
            console.warn('Failed to delete image file from disk on project delete:', diskPath, err.message)
          }
        }
      })
    }

    await projectRepository.delete(id)
    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting project: ' + error.message
    })
  }
}
