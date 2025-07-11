import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

console.log(' MongoDB URI configured:', uri ? 'YES' : 'NO');
console.log(' Connecting to:', uri?.includes('mongodb+srv') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB');

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Module-level cache for development
let cachedClientPromise: Promise<MongoClient> | null = null;

if (process.env.NODE_ENV === 'development') {
  if (!cachedClientPromise) {
    client = new MongoClient(uri);
    cachedClientPromise = client.connect();
  }
  clientPromise = cachedClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

clientPromise
  .then(() => console.log(' MongoDB connected successfully'))
  .catch((error) => console.error(' MongoDB connection failed:', error.message));

export default clientPromise;