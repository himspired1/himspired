// Load environment variables from .env.local FIRST
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables before importing anything else
config({ path: resolve(process.cwd(), '.env.local') });

// Import MongoDB directly (not through our lib)
import { MongoClient } from 'mongodb';

interface IndexSpec {
  name: string;
  key: Record<string, number>;
  options?: Record<string, unknown>;
}

// Define indexes we need for optimal performance
const ORDER_INDEXES: IndexSpec[] = [
  {
    name: 'orderId_unique',
    key: { orderId: 1 },
    options: { unique: true }
  },
  {
    name: 'status_index',
    key: { status: 1 }
  },
  {
    name: 'createdAt_desc',
    key: { createdAt: -1 }
  },
  {
    name: 'customer_email',
    key: { "customerInfo.email": 1 }
  },
  // Compound index for common queries
  {
    name: 'status_createdAt',
    key: { status: 1, createdAt: -1 }
  }
];

export const createIndexes = async () => {
  let client: MongoClient | null = null;
  
  try {
    console.log('Creating database indexes...');
    
    // Debug: Check if URI is available after dotenv loading
    const uri = process.env.MONGODB_URI;
    console.log('URI check:', uri ? 'FOUND' : 'NOT FOUND');
    
    if (!uri) {
      throw new Error('MONGODB_URI not found in environment variables. Please check your .env.local file.');
    }

    // Connect directly
    console.log('Connecting to MongoDB...');
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Test connection
    await client.db('admin').command({ ping: 1 });
    console.log('MongoDB ping successful');
    
    const db = client.db('himspired');
    const ordersCollection = db.collection('orders');

    // Get existing indexes
    const existingIndexes = await ordersCollection.listIndexes().toArray();
    const existingIndexNames = new Set(existingIndexes.map(idx => idx.name));

    let createdCount = 0;
    let skippedCount = 0;

    for (const indexSpec of ORDER_INDEXES) {
      if (existingIndexNames.has(indexSpec.name)) {
        console.log(`  Index '${indexSpec.name}' already exists`);
        skippedCount++;
        continue;
      }
      
      try {
        await ordersCollection.createIndex(indexSpec.key, {
          name: indexSpec.name,
          ...indexSpec.options,
          background: true // Create in background to avoid blocking
        });
        
        console.log(`  Created index '${indexSpec.name}'`);
        createdCount++;
      } catch (error) {
        console.error(`  Failed to create index '${indexSpec.name}':`, error);
        // TODO: Should we continue or fail here? Need to decide based on requirements
      }
    }

    console.log(`Index creation complete: ${createdCount} created, ${skippedCount} skipped`);
    
    // Show final index stats
    const finalIndexes = await ordersCollection.listIndexes().toArray();
    console.log(`Total indexes on orders collection: ${finalIndexes.length}`);
    
    return { success: true, created: createdCount, skipped: skippedCount };
  } catch (error) {
    console.error('Failed to create indexes:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  } finally {
    // Always close the connection
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
};

// Run directly if called as script
if (require.main === module) {
  createIndexes()
    .then((result) => {
      if (result.success) {
        console.log('Script completed successfully!');
        process.exit(0);
      } else {
        console.error('Script failed:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}