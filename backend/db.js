const mongoose = require("mongoose");

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 5000;

const connectDB = async (retryCount = 0) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });

    console.log(
      `✅ MongoDB Connected: ${conn.connection.host}`
    );

  } catch (error) {
    console.error(
      `❌ MongoDB Connection Error (attempt ${retryCount + 1}/${MAX_RETRIES}): ${error.message}`
    );

    if (retryCount < MAX_RETRIES - 1) {
      console.log(`🔄 Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      setTimeout(() => connectDB(retryCount + 1), RETRY_DELAY_MS);
    } else {
      console.error(
        "⛔ Max retries reached. Could not connect to MongoDB.\n" +
        "👉 Fix: Go to https://cloud.mongodb.com → Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)"
      );
    }
  }
};

// Auto-reconnect on disconnect
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
  setTimeout(() => connectDB(), RETRY_DELAY_MS);
});

module.exports = connectDB;