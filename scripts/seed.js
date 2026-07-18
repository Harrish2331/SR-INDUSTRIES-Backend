import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { connectDB, dbState } from '../config/db.js'
import { projectRepository } from '../services/projectRepository.js'

// Load env variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const downloadsDir = 'C:\\Users\\Yashwanth\\Downloads'
const uploadsDir = path.resolve(__dirname, '../uploads')

// Image file mapping
const imageMapping = [
  { from: 'WhatsApp Image 2026-07-14 at 06.43.25.jpeg', to: 'project-stairs-1.jpg' },
  { from: 'WhatsApp Image 2026-07-14 at 06.43.25 (1).jpeg', to: 'project-stairs-2.jpg' },
  { from: 'WhatsApp Image 2026-07-14 at 06.43.26.jpeg', to: 'project-birdnet-1.jpg' },
  { from: 'WhatsApp Image 2026-07-14 at 06.43.26 (1).jpeg', to: 'project-birdnet-2.jpg' },
  { from: 'WhatsApp Image 2026-07-14 at 06.43.27.jpeg', to: 'project-barbed-1.jpg' },
  { from: 'WhatsApp Image 2026-07-14 at 06.43.28.jpeg', to: 'project-partition-1.jpg' },
  { from: 'WhatsApp Image 2026-07-14 at 06.43.28 (1).jpeg', to: 'project-handrails-1.jpg' },
  { from: 'WhatsApp Image 2026-07-14 at 06.43.29.jpeg', to: 'project-roofing-1.jpg' }
]

// Unsplash fallbacks
const fallbacks = {
  stairs: [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80'
  ],
  birdnet: [
    'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1610557892470-76d747e4949f?auto=format&fit=crop&w=800&q=80'
  ],
  barbed: [
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
  ],
  partition: [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'
  ],
  handrails: [
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80'
  ],
  roofing: [
    'https://images.unsplash.com/photo-1610557892470-76d747e4949f?auto=format&fit=crop&w=800&q=80'
  ]
}

const copyImages = () => {
  console.log('📂 Processing image migration from Downloads...')
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  const resultUrls = {}

  imageMapping.forEach(item => {
    const srcPath = path.join(downloadsDir, item.from)
    const destPath = path.join(uploadsDir, item.to)

    if (fs.existsSync(srcPath)) {
      try {
        fs.copyFileSync(srcPath, destPath)
        console.log(`✅ Copied: ${item.from} -> ${item.to}`)
        resultUrls[item.to] = `/uploads/${item.to}`
      } catch (err) {
        console.warn(`⚠️ Failed to copy ${item.from}: ${err.message}`)
      }
    } else {
      console.warn(`ℹ️ Image not found in Downloads: ${item.from}`)
    }
  })

  return resultUrls
}

const seed = async () => {
  // Connect to DB (will fallback to JSON mode if Mongo is down)
  await connectDB()

  // Copy images
  const copiedImages = copyImages()

  // Define projects
  const initialProjects = [
    {
      title: 'External MS Staircase with Handrails',
      category: 'Structural Fabrication',
      location: 'Vagai Towers, Ambattur',
      description: 'Fabricated and installed a heavy-duty four-floor external MS staircase complete with precision-engineered safety handrails. Built for durability, structural stability, and safe emergency access while maintaining a clean industrial finish.',
      features: [
        'Four Floor Staircase',
        'MS Fabrication',
        'Handrails',
        'Heavy Duty Structure',
        'Precision Welding'
      ],
      images: [
        copiedImages['project-stairs-1.jpg'] || fallbacks.stairs[0],
        copiedImages['project-stairs-2.jpg'] || fallbacks.stairs[1]
      ],
      featured: true,
      displayOrder: 1
    },
    {
      title: 'Bird Net Protection System',
      category: 'Safety Installation',
      location: 'Alsa Garden',
      description: 'Installed a complete bird net protection system around the spiral staircase to prevent bird intrusion while maintaining ventilation, visibility, and architectural appearance.',
      features: [
        'Bird Net Installation',
        'UV Resistant Net',
        'Safety Solution',
        'Long Life'
      ],
      images: [
        copiedImages['project-birdnet-1.jpg'] || fallbacks.birdnet[0],
        copiedImages['project-birdnet-2.jpg'] || fallbacks.birdnet[1]
      ],
      featured: true,
      displayOrder: 2
    },
    {
      title: 'GI Barbed Wire Fencing',
      category: 'Security Fencing',
      location: 'Padappai',
      description: 'Installed heavy-duty galvanized barbed wire fencing to enhance perimeter security using corrosion-resistant materials designed for industrial and commercial environments.',
      features: [
        'GI Barbed Wire',
        'Security Fencing',
        'Corrosion Resistant',
        'Industrial Installation'
      ],
      images: [
        copiedImages['project-barbed-1.jpg'] || fallbacks.barbed[0]
      ],
      featured: true,
      displayOrder: 3
    },
    {
      title: 'Aluminium Room Partition',
      category: 'Aluminium Fabrication',
      location: 'Nabati Warehouse',
      description: 'Designed and installed modular aluminium room partitions inside the warehouse, creating functional office spaces with a modern appearance and durable construction.',
      features: [
        'Aluminium Fabrication',
        'Office Partition',
        'Modular Design',
        'Warehouse Installation'
      ],
      images: [
        copiedImages['project-partition-1.jpg'] || fallbacks.partition[0]
      ],
      featured: false,
      displayOrder: 4
    },
    {
      title: 'MS Staircase Handrails',
      category: 'MS Fabrication',
      location: 'Vallam',
      description: 'Fabricated and installed premium MS staircase handrails designed for maximum safety, structural strength, and a clean architectural appearance.',
      features: [
        'Staircase Handrails',
        'MS Fabrication',
        'Precision Welding',
        'Durable Finish'
      ],
      images: [
        copiedImages['project-handrails-1.jpg'] || fallbacks.handrails[0]
      ],
      featured: false,
      displayOrder: 5
    },
    {
      title: 'MS Handrails with Roofing Sheet Enclosure',
      category: 'MS Fabrication',
      location: 'New Perungalathur',
      description: 'Designed and fabricated MS handrails along with plain roofing sheet side enclosures to provide improved safety, weather protection, and an aesthetically clean finish using precision fabrication techniques.',
      features: [
        'MS Handrails',
        'Roofing Sheet Enclosure',
        'Weather Protection',
        'Heavy Duty Fabrication'
      ],
      images: [
        copiedImages['project-roofing-1.jpg'] || fallbacks.roofing[0]
      ],
      featured: false,
      displayOrder: 6
    }
  ]

  console.log('🌱 Seeding projects into database/mock persistence...')
  
  try {
    // Clear existing projects first to ensure clean seed
    const existing = await projectRepository.getAll()
    for (const item of existing) {
      await projectRepository.delete(item._id)
    }

    // Insert new projects
    for (const p of initialProjects) {
      await projectRepository.create(p)
    }
    
    console.log(`🎉 Seeding completed! Loaded ${initialProjects.length} projects. Mode: ${dbState.mode}`)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
  } finally {
    process.exit(0)
  }
}

seed()
