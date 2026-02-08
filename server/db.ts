import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://trantuankiet0518_db_user:lpokmoppo1234@cluster0.9bernpl.mongodb.net/?appName=Cluster0';

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

export default connectDB;
