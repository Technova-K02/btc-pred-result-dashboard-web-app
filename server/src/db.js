const { MongoClient } = require('mongodb');

const DEFAULT_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DEFAULT_DB_NAME = process.env.MONGODB_DB_NAME || 'prediction';

let client;
let db;

async function connectToDb() {
  if (db) {
    return db;
  }

  const uri = DEFAULT_URI;
  const dbName = DEFAULT_DB_NAME;

  client = new MongoClient(uri, {
    // Use unified topology and modern driver defaults
    maxPoolSize: 10
  });

  await client.connect();
  db = client.db(dbName);
  // eslint-disable-next-line no-console
  console.log(`Connected to MongoDB at ${uri}, db "${dbName}"`);

  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDb() first.');
  }
  return db;
}

async function closeDb() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = {
  connectToDb,
  getDb,
  closeDb
};

