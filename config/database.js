const { MongoClient } = require("mongodb");
require("dotenv").config();

const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;

const atlasURI = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/`;

const client = new MongoClient(atlasURI);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGODB_DATABASE);
    console.log("✅ Connected to MongoDB");
  }
  return db;
}

module.exports = { connectDB };
