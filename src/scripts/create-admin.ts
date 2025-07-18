import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import readline from "readline";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set in environment");
  process.exit(1);
}

function getPassword(): Promise<string> {
  // Priority: ENV > CLI arg > prompt
  const envPassword = process.env.ADMIN_PASSWORD;
  if (envPassword) return Promise.resolve(envPassword);
  const cliPassword = process.argv[2];
  if (cliPassword) return Promise.resolve(cliPassword);
  // Prompt user securely
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    let muted = true;
    rl.question("Enter admin password: ", (password) => {
      rl.close();
      resolve(password);
    });
    // @ts-expect-error: Node readline does not type _writeToOutput, but this is needed for password masking
    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (muted) process.stdout.write("*");
      else process.stdout.write(stringToWrite);
    };
    setTimeout(() => {
      muted = false;
    }, 0); // Unmute after first prompt
  });
}

async function createAdmin() {
  const password = await getPassword();
  if (!password) {
    console.error(
      "No password provided. Set ADMIN_PASSWORD env, pass as CLI arg, or enter at prompt."
    );
    process.exit(1);
  }
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
    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();
    try {
      await adminCollection.insertOne({
        username: "admin",
        passwordHash,
        createdAt: now,
        updatedAt: now,
      });
      console.log("Admin user created: username=admin");
    } catch (insertErr: unknown) {
      if (
        typeof insertErr === "object" &&
        insertErr !== null &&
        "code" in insertErr &&
        (insertErr as { code?: unknown }).code === 11000
      ) {
        console.error("Duplicate admin user detected. Admin not created.");
      } else {
        throw insertErr;
      }
    }
  } catch (err) {
    console.error("Failed to create admin user:", err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

createAdmin();
