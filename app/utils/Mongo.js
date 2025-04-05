import mongoose from "mongoose";

export const createDbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Successfully connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1); // Exit the process if the connection fails
  }
};

export const closeDbConnection = async () => {
  try {
    await mongoose.disconnect();
    console.log("Mongoose disconnected on app termination");
    process.exit(0);
  } catch (error) {
    console.error("Error disconnecting from MongoDB:", error.message);
    process.exit(1);
  }
};