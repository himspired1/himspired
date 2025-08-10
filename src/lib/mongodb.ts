import { MongoClient, MongoClientOptions } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

// Calculate optimal pool size for 200+ concurrent users
// Rule of thumb: maxPoolSize should be 2-3x the number of concurrent users
// For 200+ users, we need at least 400-600 connections
const calculateOptimalPoolSize = () => {
  const envPoolSize = process.env.MONGODB_MAX_POOL_SIZE;
  if (envPoolSize) {
    const parsedSize = parseInt(envPoolSize, 10);

    // Validate the parsed value is a finite number
    if (Number.isFinite(parsedSize)) {
      // Clamp the value within reasonable bounds (10 to 10000)
      const clampedSize = Math.max(10, Math.min(10000, parsedSize));

      // Log if the value was clamped for debugging
      if (clampedSize !== parsedSize) {
        console.warn(
          `⚠️  MONGODB_MAX_POOL_SIZE ${parsedSize} was clamped to ${clampedSize} (valid range: 10-10000)`
        );
      }

      return clampedSize;
    } else {
      console.warn(
        `⚠️  Invalid MONGODB_MAX_POOL_SIZE "${envPoolSize}", falling back to default 500`
      );
    }
  }

  // Default to 500 for high concurrency (200+ users)
  // This provides 2.5x the connection capacity needed
  return 500;
};

const options: MongoClientOptions = {
  // Optimized pool size for 200+ concurrent users
  maxPoolSize: calculateOptimalPoolSize(),
  minPoolSize: 20, // Increased minimum connections for better performance
  maxIdleTimeMS: 60000, // Increased idle time to 60 seconds for better connection reuse
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 30000,
  family: 4,
  retryReads: true,
  retryWrites: true, // Enable retry for writes as well
  // OPTIMIZATION: Add connection pool monitoring
  monitorCommands: process.env.NODE_ENV === "development",
  // OPTIMIZATION: Use compression for better performance
  compressors: ["zlib"],
  zlibCompressionLevel: 6,
  // CRITICAL: Add better error handling and retry logic
  serverApi: {
    version: "1",
    strict: true,
    deprecationErrors: true,
  },
  // Add heartbeat frequency to detect connection issues faster
  heartbeatFrequencyMS: 10000,
  // Add connection string validation
  directConnection: false,
  // OPTIMIZATION: Add connection pool monitoring and alerting
  maxConnecting: 10, // Limit concurrent connection attempts
  // OPTIMIZATION: Better connection management
  waitQueueTimeoutMS: 30000, // Wait up to 30 seconds for available connection
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// CRITICAL: Add connection health check with pool monitoring
export async function checkDatabaseConnection(): Promise<{
  healthy: boolean;
  poolSize?: number;
  availableConnections?: number;
}> {
  try {
    const client = await clientPromise;
    await client.db("admin").command({ ping: 1 });

    try {
      // Get connection pool statistics
      const poolStats = await client.db("admin").command({
        serverStatus: 1,
        connections: 1,
      });

      console.log("✅ MongoDB connection healthy");
      console.log(
        `📊 Connection pool: ${options.maxPoolSize} max, ${options.minPoolSize} min`
      );

      return {
        healthy: true,
        poolSize: options.maxPoolSize,
        availableConnections: poolStats.connections?.available || 0,
      };
    } catch (poolError: unknown) {
      // Handle authorization errors from serverStatus command
      const error = poolError as {
        code?: number;
        codeName?: string;
        message?: string;
      };
      if (
        error.code === 13 ||
        error.codeName === "Unauthorized" ||
        error.message?.includes("not authorized") ||
        error.message?.includes("insufficient privileges")
      ) {
        console.log("✅ MongoDB connection healthy (ping successful)");
        console.log(
          "⚠️  Connection pool stats unavailable due to insufficient privileges"
        );

        return {
          healthy: true,
          poolSize: options.maxPoolSize,
          // availableConnections will be undefined since we can't access pool stats
        };
      }

      // Re-throw other errors that aren't authorization-related
      throw poolError;
    }
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    return { healthy: false };
  }
}

// CRITICAL: Add connection retry logic with exponential backoff
export async function getClientWithRetry(maxRetries = 3): Promise<MongoClient> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await clientPromise;
      // Test the connection
      await client.db("admin").command({ ping: 1 });
      return client;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        throw new Error(
          `Failed to connect to MongoDB after ${maxRetries} attempts`
        );
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`Retrying MongoDB connection in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Failed to connect to MongoDB");
}

// NEW: Connection pool monitoring and alerting
export async function monitorConnectionPool(): Promise<void> {
  const startTime = Date.now();
  try {
    const client = await clientPromise;
    const db = client.db("admin");

    // Get detailed connection pool statistics
    const serverStatus = await db.command({ serverStatus: 1 });
    const connections = serverStatus.connections || {};

    const totalConnections = connections.current || 0;
    const availableConnections = connections.available || 0;
    const activeConnections = totalConnections - availableConnections;
    const maxPoolSize = options.maxPoolSize || 500;

    // Calculate key metrics
    const utilization = (activeConnections / maxPoolSize) * 100;
    const availablePercentage = (availableConnections / maxPoolSize) * 100;

    // Log pool statistics
    console.log(`📊 MongoDB Pool Status:`);
    console.log(`   Total Connections: ${totalConnections}`);
    console.log(`   Available Connections: ${availableConnections}`);
    console.log(`   Active Connections: ${activeConnections}`);
    console.log(`   Max Pool Size: ${maxPoolSize}`);
    console.log(`   Utilization: ${utilization.toFixed(1)}%`);
    console.log(`   Available: ${availablePercentage.toFixed(1)}%`);

    // CRITICAL ALERTS: Connection pool health
    if (utilization > 90) {
      console.error(
        `🚨 CRITICAL: MongoDB connection pool utilization: ${utilization.toFixed(1)}%`
      );
      console.error(`   Pool is nearly exhausted. Immediate action required.`);
      await sendDatabaseAlert(
        "CRITICAL",
        `MongoDB pool utilization: ${utilization.toFixed(1)}%`
      );
    } else if (utilization > 80) {
      console.warn(
        `⚠️ WARNING: MongoDB connection pool utilization: ${utilization.toFixed(1)}%`
      );
      console.warn(
        `   Consider increasing MONGODB_MAX_POOL_SIZE environment variable`
      );
      await sendDatabaseAlert(
        "WARNING",
        `MongoDB pool utilization: ${utilization.toFixed(1)}%`
      );
    }

    // CRITICAL ALERTS: Available connections
    if (availableConnections < 5) {
      console.error(
        `🚨 CRITICAL: Very low available connections: ${availableConnections}`
      );
      console.error(`   System may become unresponsive soon.`);
      await sendDatabaseAlert(
        "CRITICAL",
        `Low available connections: ${availableConnections}`
      );
    } else if (availableConnections < 10) {
      console.warn(
        `⚠️ WARNING: Low available connections: ${availableConnections}`
      );
      await sendDatabaseAlert(
        "WARNING",
        `Low available connections: ${availableConnections}`
      );
    }

    // Performance monitoring
    const operations = serverStatus.opcounters || {};
    const queries = operations.query || 0;
    const inserts = operations.insert || 0;
    const updates = operations.update || 0;
    const deletes = operations.delete || 0;

    // Measure response time for the serverStatus command
    const responseTime = Date.now() - startTime;

    console.log(`📈 Database Operations:`);
    console.log(`   Queries: ${queries}`);
    console.log(`   Inserts: ${inserts}`);
    console.log(`   Updates: ${updates}`);
    console.log(`   Deletes: ${deletes}`);

    // Memory monitoring
    const mem = serverStatus.mem || {};
    const residentMB = Math.round(mem.resident || 0);
    const virtualMB = Math.round(mem.virtual || 0);

    console.log(`💾 Memory Usage:`);
    console.log(`   Resident: ${residentMB}MB`);
    console.log(`   Virtual: ${virtualMB}MB`);

    console.log(`⏱️  Response Time: ${responseTime}ms`);

    // Store metrics for trending
    await storeDatabaseMetrics({
      timestamp: Date.now(),
      totalConnections,
      availableConnections,
      activeConnections,
      utilization,
      queries,
      inserts,
      updates,
      deletes,
      residentMB,
      virtualMB,
      responseTime,
    });
  } catch (error) {
    console.error("Failed to monitor connection pool:", error);
    await sendDatabaseAlert(
      "ERROR",
      `Database monitoring failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// NEW: Database alerting system
async function sendDatabaseAlert(
  level: "CRITICAL" | "WARNING" | "ERROR",
  message: string
): Promise<void> {
  try {
    const alert = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: "MongoDB",
      environment: process.env.NODE_ENV || "development",
    };

    // Log alert
    console.log(`🚨 Database Alert [${level}]: ${message}`);

    // Store alert in database for tracking
    const client = await clientPromise;
    const db = client.db("himspired");
    const alertsCollection = db.collection("database_alerts");

    await alertsCollection.insertOne({
      ...alert,
      createdAt: new Date(),
    });

    // TODO: Integrate with external alerting services
    // Examples: Slack, Discord, Email, PagerDuty, etc.
    // await sendSlackAlert(alert);
    // await sendEmailAlert(alert);
    // await sendPagerDutyAlert(alert);
  } catch (error) {
    console.error("Failed to send database alert:", error);
  }
}

// NEW: Store database metrics for trending
async function storeDatabaseMetrics(metrics: {
  timestamp: number;
  totalConnections: number;
  availableConnections: number;
  activeConnections: number;
  utilization: number;
  queries: number;
  inserts: number;
  updates: number;
  deletes: number;
  residentMB: number;
  virtualMB: number;
  responseTime: number;
}): Promise<void> {
  try {
    const client = await clientPromise;
    const db = client.db("himspired");
    const metricsCollection = db.collection("database_metrics");

    await metricsCollection.insertOne({
      ...metrics,
      createdAt: new Date(),
    });

    // Clean up old metrics (keep last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await metricsCollection.deleteMany({
      createdAt: { $lt: sevenDaysAgo },
    });
  } catch (error) {
    console.error("Failed to store database metrics:", error);
  }
}

// NEW: Comprehensive database health check
export async function performDatabaseHealthCheck(): Promise<{
  healthy: boolean;
  details: {
    connection: boolean;
    pool: boolean;
    performance: boolean;
    memory: boolean;
  };
  metrics: {
    utilization: number;
    availableConnections: number;
    responseTime: number;
  };
}> {
  const startTime = Date.now();
  const healthCheck = {
    healthy: true,
    details: {
      connection: false,
      pool: false,
      performance: false,
      memory: false,
    },
    metrics: {
      utilization: 0,
      availableConnections: 0,
      responseTime: 0,
    },
  };

  try {
    const client = await clientPromise;
    const db = client.db("admin");

    // 1. Connection health check
    try {
      await db.command({ ping: 1 });
      healthCheck.details.connection = true;
    } catch (error) {
      healthCheck.healthy = false;
      console.error("Database connection health check failed:", error);
    }

    // 2. Pool health check
    try {
      const serverStatus = await db.command({ serverStatus: 1 });
      const connections = serverStatus.connections || {};
      const totalConnections = connections.current || 0;
      const availableConnections = connections.available || 0;
      const maxPoolSize = options.maxPoolSize || 500;
      const utilization =
        ((totalConnections - availableConnections) / maxPoolSize) * 100;

      healthCheck.metrics.utilization = utilization;
      healthCheck.metrics.availableConnections = availableConnections;

      // Pool is healthy if utilization < 90% and available connections > 5
      healthCheck.details.pool = utilization < 90 && availableConnections > 5;

      if (!healthCheck.details.pool) {
        healthCheck.healthy = false;
      }
    } catch (error) {
      healthCheck.healthy = false;
      healthCheck.details.pool = false;
      console.error("Database pool health check failed:", error);
    }

    // 3. Performance health check
    try {
      const testStart = Date.now();
      await db.command({ ping: 1 });
      const responseTime = Date.now() - testStart;

      healthCheck.metrics.responseTime = responseTime;
      healthCheck.details.performance = responseTime < 1000; // Less than 1 second

      if (!healthCheck.details.performance) {
        healthCheck.healthy = false;
      }
    } catch (error) {
      healthCheck.healthy = false;
      healthCheck.details.performance = false;
      console.error("Database performance health check failed:", error);
    }

    // 4. Memory health check
    try {
      const serverStatus = await db.command({ serverStatus: 1 });
      const mem = serverStatus.mem || {};
      const residentMB = (mem.resident || 0) / 1024 / 1024;

      // Memory is healthy if resident memory < 2GB (adjust as needed)
      healthCheck.details.memory = residentMB < 2048;

      if (!healthCheck.details.memory) {
        healthCheck.healthy = false;
      }
    } catch (error) {
      healthCheck.healthy = false;
      healthCheck.details.memory = false;
      console.error("Database memory health check failed:", error);
    }

    healthCheck.metrics.responseTime = Date.now() - startTime;

    // Log health check results
    if (healthCheck.healthy) {
      console.log("✅ Database health check passed");
    } else {
      console.error("❌ Database health check failed:", healthCheck.details);
      await sendDatabaseAlert(
        "WARNING",
        `Database health check failed: ${JSON.stringify(healthCheck.details)}`
      );
    }

    return healthCheck;
  } catch (error) {
    console.error("Database health check failed:", error);
    await sendDatabaseAlert(
      "ERROR",
      `Database health check error: ${error instanceof Error ? error.message : "Unknown error"}`
    );

    return {
      healthy: false,
      details: {
        connection: false,
        pool: false,
        performance: false,
        memory: false,
      },
      metrics: {
        utilization: 0,
        availableConnections: 0,
        responseTime: 0,
      },
    };
  }
}

// NEW: Get database performance trends
export async function getDatabaseTrends(hours: number = 24): Promise<{
  avgUtilization: number;
  avgResponseTime: number;
  peakConnections: number;
  totalOperations: number;
}> {
  try {
    const client = await clientPromise;
    const db = client.db("himspired");
    const metricsCollection = db.collection("database_metrics");

    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;

    const metrics = await metricsCollection
      .find({ timestamp: { $gte: cutoffTime } })
      .sort({ timestamp: 1 })
      .toArray();

    if (metrics.length === 0) {
      return {
        avgUtilization: 0,
        avgResponseTime: 0,
        peakConnections: 0,
        totalOperations: 0,
      };
    }

    const avgUtilization =
      metrics.reduce((sum, m) => sum + m.utilization, 0) / metrics.length;
    const avgResponseTime =
      metrics.reduce((sum, m) => sum + (m.responseTime || 0), 0) /
      metrics.length;
    const peakConnections = Math.max(
      ...metrics.map((m) => m.activeConnections || 0)
    );
    const totalOperations = metrics.reduce(
      (sum, m) => sum + m.queries + m.inserts + m.updates + m.deletes,
      0
    );

    return {
      avgUtilization,
      avgResponseTime,
      peakConnections,
      totalOperations,
    };
  } catch (error) {
    console.error("Failed to get database trends:", error);
    return {
      avgUtilization: 0,
      avgResponseTime: 0,
      peakConnections: 0,
      totalOperations: 0,
    };
  }
}

// NEW: Initialize comprehensive monitoring
if (process.env.NODE_ENV === "production") {
  // Monitor connection pool every 5 minutes
  setInterval(monitorConnectionPool, 5 * 60 * 1000);

  // Perform comprehensive health check every 10 minutes
  setInterval(performDatabaseHealthCheck, 10 * 60 * 1000);

  // Initial monitoring after 30 seconds
  setTimeout(() => {
    monitorConnectionPool();
    performDatabaseHealthCheck();
  }, 30000);
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

// Performance logging wrapper with connection pool awareness
export async function withPerformanceLogging<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    // Log slow queries for optimization
    if (duration > 100) {
      console.log(`Slow query detected: ${operationName} took ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `Query failed: ${operationName} failed after ${duration}ms`,
      error
    );
    throw error;
  }
}
