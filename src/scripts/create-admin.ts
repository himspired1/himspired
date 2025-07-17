import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI not set in environment");
}

async function createAdmin() {
  const client = new MongoClient(uri!);
  try {
    await client.connect();
    const db = client.db();
    const adminCollection = db.collection("admin_users");
    const existing = await adminCollection.findOne({ username: "admin" });
    if (existing) {
      console.log("Admin user already exists.");
      return;
    }
    const passwordHash = await bcrypt.hash("himspired", 12);
    const now = new Date();
    await adminCollection.insertOne({
      username: "admin",
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });
    console.log("Admin user created: username=admin, password=himspired");
  } finally {
    await client.close();
  }
}

createAdmin().catch((err) => {
  console.error("Failed to create admin user:", err);
  process.exit(1);
});
