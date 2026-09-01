const mongoose = require("mongoose");

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const connectDB = async (retryCount = 0) => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is not defined. " +
        "For local dev: add it to backend/server/.env. " +
        "For Render: set it in the dashboard Environment settings."
      );
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // Fail fast if Atlas/Mongo unreachable
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);

    if (retryCount < MAX_RETRIES) {
      console.log(
        `🔄 Retrying connection in ${RETRY_DELAY_MS / 1000}s... ` +
        `(attempt ${retryCount + 1}/${MAX_RETRIES})`
      );
      setTimeout(() => connectDB(retryCount + 1), RETRY_DELAY_MS);
    } else {
      console.error("❌ Max MongoDB connection retries reached. Exiting.");
      process.exit(1);
    }
  }
};

// Auto-reconnect on unexpected disconnection
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
  connectDB();
});

mongoose.connection.on("error", (err) => {
  console.error(`❌ MongoDB connection error: ${err.message}`);
});

mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB reconnected successfully.");
});

module.exports = connectDB;