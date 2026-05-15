const { MongoClient } = require("mongodb");
require("dotenv").config();

const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;

const atlasURI = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/`;

const client = new MongoClient(atlasURI, {
  serverSelectionTimeoutMS: 5000,
  family: 4,
});

let db;

async function connectDB() {
  if (!db) {
    try {
      await client.connect();
      db = client.db(process.env.MONGODB_DATABASE);
      console.log("Connected to MongoDB");
    } catch (err) {
      console.error("MongoDB connection failed:", err.message);
      db = null;
      throw err;
    }
  }
  return db;
}

module.exports = { connectDB };
