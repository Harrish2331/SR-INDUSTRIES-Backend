import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Inquiry from '../models/inquiryModel.js'
import { dbState } from '../config/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const mockFilePath = path.join(__dirname, '../uploads/contacts_mock.json')

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
    console.error('Failed to read mock contacts file:', error)
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
    console.error('Failed to write mock contacts file:', error)
    return false
  }
}

export const inquiryRepository = {
  async getAll() {
    if (dbState.isConnected) {
      return await Inquiry.find().sort({ createdAt: -1 })
    } else {
      const items = readMockFile()
      // Sort by createdAt descending
      return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
  },

  async create(inquiryData) {
    if (dbState.isConnected) {
      const inquiry = new Inquiry(inquiryData)
      return await inquiry.save()
    } else {
      const items = readMockFile()
      const newInquiry = {
        _id: generateMockId(),
        ...inquiryData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      items.push(newInquiry)
      writeMockFile(items)
      return newInquiry
    }
  },

  async delete(id) {
    if (dbState.isConnected) {
      return await Inquiry.findByIdAndDelete(id)
    } else {
      const items = readMockFile()
      const index = items.findIndex((item) => item._id === id)
      if (index === -1) return null
      
      const deletedItem = items[index]
      const updatedItems = items.filter((item) => item._id !== id)
      writeMockFile(updatedItems)
      
      // Delete associated attachment from disk if any and if not referenced elsewhere
      if (deletedItem.attachment) {
        const filename = path.basename(deletedItem.attachment)
        const diskPath = path.join(__dirname, '../uploads', filename)
        if (fs.existsSync(diskPath)) {
          try {
            fs.unlinkSync(diskPath)
          } catch (err) {
            console.warn('Failed to delete attachment from disk:', diskPath, err.message)
          }
        }
      }
      
      return deletedItem
    }
  }
}
