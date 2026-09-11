// backend/config/db.js

const mongoose = require('mongoose');
require('dotenv').config(); // Ensure environment variables are loaded

// Define the database connection function
const connectDB = async () => {
  try {
    // Check if the MONGO_URI environment variable is set
    if (!process.env.MONGO_URI) {
      console.error('FATAL ERROR: MONGO_URI environment variable is not set.');
      process.exit(1); // Exit if the connection string is missing
    }

    console.log("--- DEBUG ---");
console.log("NODE_ENV:", process.env.NODE_ENV); // Check environment
console.log("MONGO_URI:", process.env.MONGO_URI); // Log the URI being used
console.log("--- END DEBUG ---");

    // Attempt to connect to MongoDB using the URI from .env
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 6+ handles many options automatically.
      // You might add options here if needed based on specific requirements or future Mongoose versions.
      // Example: dbName: 'cineplus' (often inferred from URI, but can be explicit)
      // Example: appName: 'CinePlusAPI' (useful for monitoring)
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`); // Log success message with the host

  } catch (error) {
    // Log any error that occurs during connection
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Exit the Node.js process with a failure code (1)
    process.exit(1);
  }
};

// Export the connection function
module.exports = connectDB;