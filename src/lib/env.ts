import { z } from "zod";

// Environment variable schema
const envSchema = z.object({
  // Database
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  // JWT
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),

  // Admin Authentication
  ADMIN_USERNAME: z.string().min(1, "ADMIN_USERNAME is required"),
  ADMIN_PASSWORD: z
    .string()
    .min(8, "ADMIN_PASSWORD must be at least 8 characters"),
  ADMIN_PASSWORD_HASH: z.string().min(1, "ADMIN_PASSWORD_HASH is required"),

  // Email Configuration
  EMAIL_USER: z.string().email("EMAIL_USER must be a valid email"),
  EMAIL_PASS: z.string().min(1, "EMAIL_PASS is required"),

  // Cloudinary (for file uploads)
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),

  // Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/**
 * Validates the application's environment variables against the predefined schema.
 *
 * Attempts to parse and validate `process.env` using the environment schema. Returns an object indicating success and the validated environment variables, or failure with the validation error.
 *
 * @returns An object with `{ success: true, env }` if validation succeeds, or `{ success: false, error }` if validation fails.
 */
export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return { success: true, env };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );
      console.error("❌ Environment validation failed:");
      missingVars.forEach((msg) => console.error(`  - ${msg}`));
      console.error(
        "\nPlease check your .env.local file and ensure all required variables are set."
      );
    }
    return { success: false, error };
  }
}

/**
 * Returns the validated environment variables, throwing an error if validation fails.
 *
 * @returns The validated environment variables object
 */
export function getEnv() {
  const result = validateEnv();
  if (!result.success) {
    throw new Error("Environment validation failed");
  }
  return result.env;
}

/**
 * Determines whether the current runtime environment is set to production.
 *
 * @returns `true` if `NODE_ENV` is "production", otherwise `false`
 */
export function isProduction() {
  return process.env.NODE_ENV === "production";
}

/**
 * Determines if the current runtime environment is set to development.
 *
 * @returns True if `NODE_ENV` is "development", otherwise false.
 */
export function isDevelopment() {
  return process.env.NODE_ENV === "development";
}
