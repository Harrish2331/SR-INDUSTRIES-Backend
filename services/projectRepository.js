import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Project from '../models/projectModel.js'
import { dbState } from '../config/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const mockFilePath = path.join(__dirname, '../uploads/projects_mock.json')

// Helper to generate a 24-character hex string matching MongoDB ObjectID format
const generateMockId = () => {
  return [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
}

// Read mock file with safety checks
const readMockFile = () => {
  try {
    if (!fs.existsSync(mockFilePath)) {
      return []
    }
    const data = fs.readFileSync(mockFilePath, 'utf8')
    return JSON.parse(data || '[]')
  } catch (error) {
    console.error('Failed to read mock projects file:', error)
    return []
  }
}

// Write mock file with safety checks
const writeMockFile = (data) => {
  try {
    const dir = path.dirname(mockFilePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(mockFilePath, JSON.stringify(data, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('Failed to write mock projects file:', error)
    return false
  }
}

export const projectRepository = {
  async getAll() {
    if (dbState.isConnected) {
      return await Project.find().sort({ displayOrder: 1, createdAt: -1 })
    } else {
      const items = readMockFile()
      // Sort by displayOrder ascending, then by createdAt descending
      return items.sort((a, b) => {
        const orderDiff = (a.displayOrder || 0) - (b.displayOrder || 0)
        if (orderDiff !== 0) return orderDiff
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
    }
  },

  async getById(id) {
    if (dbState.isConnected) {
      return await Project.findById(id)
    } else {
      const items = readMockFile()
      return items.find((item) => item._id === id) || null
    }
  },

  async create(projectData) {
    if (dbState.isConnected) {
      const project = new Project(projectData)
      return await project.save()
    } else {
      const items = readMockFile()
      const newProject = {
        _id: generateMockId(),
        ...projectData,
        featured: !!projectData.featured,
        displayOrder: parseInt(projectData.displayOrder || 0, 10),
        features: Array.isArray(projectData.features) ? projectData.features : [],
        images: Array.isArray(projectData.images) ? projectData.images : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      items.push(newProject)
      writeMockFile(items)
      return newProject
    }
  },

  async update(id, projectData) {
    if (dbState.isConnected) {
      return await Project.findByIdAndUpdate(
        id,
        { $set: projectData },
        { new: true, runValidators: true }
      )
    } else {
      const items = readMockFile()
      const index = items.findIndex((item) => item._id === id)
      if (index === -1) return null
      
      const updatedProject = {
        ...items[index],
        ...projectData,
        features: Array.isArray(projectData.features) ? projectData.features : items[index].features,
        images: Array.isArray(projectData.images) ? projectData.images : items[index].images,
        updatedAt: new Date().toISOString()
      }
      
      // Enforce types
      if (updatedProject.displayOrder !== undefined) {
        updatedProject.displayOrder = parseInt(updatedProject.displayOrder, 10)
      }
      if (updatedProject.featured !== undefined) {
        updatedProject.featured = !!updatedProject.featured
      }

      items[index] = updatedProject
      writeMockFile(items)
      return updatedProject
    }
  },

  async delete(id) {
    if (dbState.isConnected) {
      return await Project.findByIdAndDelete(id)
    } else {
      const items = readMockFile()
      const index = items.findIndex((item) => item._id === id)
      if (index === -1) return null
      
      const deletedItem = items[index]
      const updatedItems = items.filter((item) => item._id !== id)
      writeMockFile(updatedItems)
      return deletedItem
    }
  }
}
