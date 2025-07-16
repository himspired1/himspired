// Load environment variables from .env.local FIRST
import { config } from "dotenv";
import { resolve } from "path";
import { MongoClient, CreateIndexesOptions } from "mongodb";

// Load environment variables before importing anything else
config({ path: resolve(process.cwd(), ".env.local") });

// Define indexes we need for optimal performance
const ORDER_INDEXES: {
  name: string;
  key: { [key: string]: 1 | -1 };
  options?: CreateIndexesOptions;
}[] = [
  {
    name: "orderId_unique",
    key: { orderId: 1 },
    options: { unique: true },
  },
  {
    name: "status_index",
    key: { status: 1 },
  },
  {
    name: "createdAt_desc",
    key: { createdAt: -1 },
  },
  {
    name: "customer_email",
    key: { "customerInfo.email": 1 },
  },
  // Compound index for common queries
  {
    name: "status_createdAt",
    key: { status: 1, createdAt: -1 },
  },
];

const CONTACT_MESSAGE_INDEXES: {
  name: string;
  key: { [key: string]: 1 | -1 };
  options?: CreateIndexesOptions;
}[] = [
  {
    name: "messageId_unique",
    key: { messageId: 1 },
    options: { unique: true },
  },
  {
    name: "email_index",
    key: { email: 1 },
  },
  {
    name: "createdAt_desc",
    key: { createdAt: -1 },
  },
  {
    name: "isRead_index",
    key: { isRead: 1 },
  },
  // Compound indexes for common queries
  {
    name: "email_createdAt",
    key: { email: 1, createdAt: -1 },
  },
  {
    name: "isRead_createdAt",
    key: { isRead: 1, createdAt: -1 },
  },
  {
    name: "replies_exists",
    key: { "replies.0": 1 },
  },
];

const NEWSLETTER_INDEXES: {
  name: string;
  key: { [key: string]: 1 | -1 };
  options?: CreateIndexesOptions;
}[] = [
  {
    name: "email_unique",
    key: { email: 1 },
    options: { unique: true },
  },
  {
    name: "isActive_index",
    key: { isActive: 1 },
  },
  {
    name: "subscribedAt_desc",
    key: { subscribedAt: -1 },
  },
  {
    name: "source_index",
    key: { source: 1 },
  },
];

export const createIndexes = async () => {
  let client: MongoClient | null = null;

  try {
    console.log("Creating database indexes...");

    // Debug: Check if URI is available after dotenv loading
    const uri = process.env.MONGODB_URI;
    console.log("URI check:", uri ? "FOUND" : "NOT FOUND");

    if (!uri) {
      throw new Error(
        "MONGODB_URI not found in environment variables. Please check your .env.local file."
      );
    }

    // Connect directly
    console.log("Connecting to MongoDB...");
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    console.log("Connected to MongoDB");

    // Test connection
    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB ping successful");

    const db = client.db("himspired");

    // Create indexes for all collections
    const collections = [
      { name: "orders", indexes: ORDER_INDEXES },
      { name: "contact_messages", indexes: CONTACT_MESSAGE_INDEXES },
      { name: "newsletter_subscribers", indexes: NEWSLETTER_INDEXES },
    ];

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const collectionInfo of collections) {
      console.log(`\nProcessing collection: ${collectionInfo.name}`);
      const collection = db.collection(collectionInfo.name);

      // Get existing indexes
      const existingIndexes = await collection.listIndexes().toArray();
      const existingIndexNames = new Set(
        existingIndexes.map((idx) => idx.name)
      );

      let createdCount = 0;
      let skippedCount = 0;

      for (const indexSpec of collectionInfo.indexes) {
        if (existingIndexNames.has(indexSpec.name)) {
          console.log(`  Index '${indexSpec.name}' already exists`);
          skippedCount++;
          continue;
        }

        try {
          await collection.createIndex(indexSpec.key, {
            name: indexSpec.name,
            ...indexSpec.options,
            background: true, // Create in background to avoid blocking
          });

          console.log(`  Created index '${indexSpec.name}'`);
          createdCount++;
        } catch (error) {
          console.error(`  Failed to create index '${indexSpec.name}':`, error);
        }
      }

      console.log(
        `  ${collectionInfo.name}: ${createdCount} created, ${skippedCount} skipped`
      );
      totalCreated += createdCount;
      totalSkipped += skippedCount;
    }

    console.log(
      `\nIndex creation complete: ${totalCreated} created, ${totalSkipped} skipped`
    );

    // Show final stats for each collection
    for (const collectionInfo of collections) {
      const collection = db.collection(collectionInfo.name);
      const finalIndexes = await collection.listIndexes().toArray();
      console.log(
        `Total indexes on ${collectionInfo.name} collection: ${finalIndexes.length}`
      );
    }

    return { success: true, created: totalCreated, skipped: totalSkipped };
  } catch (error) {
    console.error("Failed to create indexes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    // Always close the connection
    if (client) {
      await client.close();
      console.log("MongoDB connection closed");
    }
  }
};

// Run directly if called as script
if (require.main === module) {
  createIndexes()
    .then((result) => {
      if (result.success) {
        console.log("Script completed successfully!");
        process.exit(0);
      } else {
        console.error("Script failed:", result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}
