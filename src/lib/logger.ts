import winston from "winston";

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || "development";
  const isDevelopment = env === "development";
  return isDevelopment ? "debug" : "warn";
};

// Define different log formats
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: logFormat,
  }),
  // File transport for errors
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
  // File transport for all logs
  new winston.transports.File({
    filename: "logs/all.log",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

// Create a stream object for Morgan
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Export logger instance
export default logger;

// Helper functions for common logging patterns
export const logError = (error: Error | string, context?: string) => {
  const message = typeof error === "string" ? error : error.message;
  const stack = error instanceof Error ? error.stack : undefined;

  logger.error({
    message,
    context,
    stack,
    timestamp: new Date().toISOString(),
  });
};

export const logInfo = (message: string, context?: string) => {
  logger.info({
    message,
    context,
    timestamp: new Date().toISOString(),
  });
};

export const logWarn = (message: string, context?: string) => {
  logger.warn({
    message,
    context,
    timestamp: new Date().toISOString(),
  });
};

export const logDebug = (message: string, context?: string) => {
  logger.debug({
    message,
    context,
    timestamp: new Date().toISOString(),
  });
};

// Performance logging
export const logPerformance = (
  operation: string,
  duration: number,
  context?: string
) => {
  const level = duration > 1000 ? "warn" : "info";
  const message = `${operation} took ${duration}ms`;

  logger.log(level, {
    message,
    context,
    duration,
    timestamp: new Date().toISOString(),
  });
};

// API request logging
export const logApiRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number
) => {
  const level = statusCode >= 400 ? "warn" : "info";

  logger.log(level, {
    message: `${method} ${url} - ${statusCode}`,
    context: "api",
    method,
    url,
    statusCode,
    duration,
    timestamp: new Date().toISOString(),
  });
};

// Database operation logging
export const logDbOperation = (
  operation: string,
  collection: string,
  duration: number,
  success: boolean
) => {
  const level = success ? "info" : "error";

  logger.log(level, {
    message: `DB ${operation} on ${collection}`,
    context: "database",
    operation,
    collection,
    duration,
    success,
    timestamp: new Date().toISOString(),
  });
};
