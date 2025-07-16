import { validateEnv } from "./env";

export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Performs a series of startup checks to validate environment configuration, database connectivity, and required credentials.
 *
 * Validates environment variables, attempts to connect to the MongoDB database, checks Cloudinary and email configuration, verifies JWT secret strength, and ensures admin credentials are set. Returns a `ValidationResult` indicating overall success, with lists of errors and warnings encountered during validation.
 *
 * @returns A promise that resolves to a `ValidationResult` object containing the outcome of the startup validation.
 */
export async function validateStartup(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 1. Validate environment variables
    const envValidation = validateEnv();
    if (!envValidation.success) {
      errors.push("Environment validation failed");
      if (envValidation.error instanceof Error) {
        errors.push(envValidation.error.message);
      }
    }

    // 2. Test database connection
    try {
      const { MongoClient } = await import("mongodb");
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        errors.push("MongoDB URI not configured");
      } else {
        const client = new MongoClient(uri, {
          serverSelectionTimeoutMS: 5000,
        });
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        await client.close();
      }
    } catch (error) {
      errors.push(
        `Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // 3. Test Cloudinary configuration
    const cloudinaryConfig = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    };

    const missingCloudinary = Object.entries(cloudinaryConfig)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingCloudinary.length > 0) {
      warnings.push(
        `Cloudinary configuration incomplete: missing ${missingCloudinary.join(", ")}`
      );
    }

    // 4. Test email configuration
    const emailConfig = {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    };

    const missingEmail = Object.entries(emailConfig)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingEmail.length > 0) {
      warnings.push(
        `Email configuration incomplete: missing ${missingEmail.join(", ")}`
      );
    }

    // 5. Check JWT secret strength
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length < 32) {
      errors.push("JWT_SECRET must be at least 32 characters long");
    }

    // 6. Check admin credentials
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminUsername) {
      errors.push("ADMIN_USERNAME not configured");
    }
    if (!adminPassword) {
      errors.push("ADMIN_PASSWORD not configured");
    }
    if (!adminPasswordHash) {
      errors.push("ADMIN_PASSWORD_HASH not configured");
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        `Startup validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
      warnings: [],
    };
  }
}

/**
 * Logs the outcome of the startup validation process to the console, including errors and warnings if present.
 *
 * @param result - The result object containing validation success status, errors, and warnings
 */
export function logValidationResult(result: ValidationResult) {
  if (result.success) {
    console.log("✅ Startup validation passed");
  } else {
    console.error("❌ Startup validation failed:");
    result.errors.forEach((error) => console.error(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn("⚠️  Startup warnings:");
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }
}
