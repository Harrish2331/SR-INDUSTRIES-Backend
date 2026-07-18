import mongoose from 'mongoose'

const inquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true
    },
    service: {
      type: String,
      required: [true, 'Requested service stream is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Project scope description is required'],
      trim: true
    },
    attachment: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
)

const Inquiry = mongoose.models.Inquiry || mongoose.model('Inquiry', inquirySchema)

export default Inquiry
