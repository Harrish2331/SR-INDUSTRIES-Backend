import mongoose from 'mongoose'

export const dbState = {
  isConnected: false,
  mode: 'MOCK_JSON'
}

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sr-industries'
  
  try {
    mongoose.set('strictQuery', false)
    
    // Connect with a 4-second timeout to fail quickly if mongod is not running
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000
    })
    
    dbState.isConnected = true
    dbState.mode = 'MONGODB'
    console.log(`🔌 MongoDB Connected Successfully: ${mongoose.connection.host}`)
    return true
  } catch (error) {
    dbState.isConnected = false
    dbState.mode = 'MOCK_JSON'
    console.warn('\n⚠️  MongoDB Connection Failed!')
    console.warn(`Attempted URI: ${mongoUri}`)
    console.warn('Reason:', error.message || error)
    console.warn('ℹ️  S R Industries server will run in "MOCK_JSON" mode with local-file persistence.\n')
    return false
  }
}
