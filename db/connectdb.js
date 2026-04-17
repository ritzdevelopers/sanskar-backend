import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10_000,
    });
    console.log("Database connected successfully");
    return mongoose.connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1); // Stop server if DB fails
  }
};

export default connectDB;