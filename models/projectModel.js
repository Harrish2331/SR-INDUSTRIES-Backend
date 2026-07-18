import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Project category is required'],
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Project location is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true
    },
    features: {
      type: [String],
      default: []
    },
    images: {
      type: [String],
      default: []
    },
    featured: {
      type: Boolean,
      default: false
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
)

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema)

export default Project
