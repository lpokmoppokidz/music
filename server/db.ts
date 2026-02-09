import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

export async function connectDB() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in environment variables!");
    process.exit(1);
  }

  try {
    // Obscure password for logging
    const obscuredUri = MONGODB_URI.replace(/:([^:@]+)@/, ":****@");
    console.log(`📡 Attempting to connect to MongoDB: ${obscuredUri}`);

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error: any) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
}

export default connectDB;
