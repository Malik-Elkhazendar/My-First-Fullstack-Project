import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  uri: string;
  name: string;
  
  // Connection Pool Settings (optimized for production)
  maxPoolSize: number;
  minPoolSize: number;
  maxIdleTimeMS: number;
  waitQueueTimeoutMS: number;
  
  // Timeout Settings
  serverSelectionTimeoutMS: number;
  socketTimeoutMS: number;
  connectTimeoutMS: number;
  heartbeatFrequencyMS: number;
  
  // Behavior Settings
  bufferCommands: boolean;
  bufferMaxEntries: number;
  retryWrites: boolean;
  retryReads: boolean;
  
  // Read/Write Concerns for data consistency
  readConcern: string;
  writeConcern: {
    w: string | number;
    j: boolean;
    wtimeout: number;
  };
  
  // Compression for network efficiency
  compressors: string[];
  
  // Security
  authSource: string;
  ssl: boolean;
  sslValidate: boolean;
  
  // Monitoring
  monitorCommands: boolean;
  loggerLevel: string;
  
  // Performance
  autoIndex: boolean;
  autoCreate: boolean;
}

export default registerAs('database', (): DatabaseConfig => {
  // Validate required environment variables
  const requiredEnvVars = ['MONGODB_URI'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }

  const isProduction = process.env.NODE_ENV === 'production';

  return {
    uri: process.env.MONGODB_URI as string,
    name: process.env.DB_NAME || 'fashion-forward',
    
    // ========================================================================
    // CONNECTION POOL SETTINGS - Optimized for E-commerce Load
    // ========================================================================
    
    // Maximum number of connections in the pool
    // Production: Higher for concurrent user sessions
    // Development: Lower to conserve resources
    maxPoolSize: parseInt(
      process.env.DB_MAX_POOL_SIZE || (isProduction ? '50' : '10'), 
      10
    ),
    
    // Minimum number of connections to maintain
    minPoolSize: parseInt(
      process.env.DB_MIN_POOL_SIZE || (isProduction ? '5' : '2'), 
      10
    ),
    
    // Time a connection can remain idle before being closed
    maxIdleTimeMS: parseInt(
      process.env.DB_MAX_IDLE_TIME_MS || '300000', // 5 minutes
      10
    ),
    
    // Time to wait for a connection from the pool
    waitQueueTimeoutMS: parseInt(
      process.env.DB_WAIT_QUEUE_TIMEOUT_MS || '10000', // 10 seconds
      10
    ),
    
    // ========================================================================
    // TIMEOUT SETTINGS - Balanced for Performance and Reliability
    // ========================================================================
    
    // Time to wait for server selection (find available server)
    serverSelectionTimeoutMS: parseInt(
      process.env.DB_SERVER_SELECTION_TIMEOUT_MS || '10000', // 10 seconds
      10
    ),
    
    // Socket timeout for individual operations
    socketTimeoutMS: parseInt(
      process.env.DB_SOCKET_TIMEOUT_MS || '60000', // 1 minute
      10
    ),
    
    // Initial connection timeout
    connectTimeoutMS: parseInt(
      process.env.DB_CONNECT_TIMEOUT_MS || '10000', // 10 seconds
      10
    ),
    
    // Frequency of heartbeat to check server health
    heartbeatFrequencyMS: parseInt(
      process.env.DB_HEARTBEAT_FREQUENCY_MS || '10000', // 10 seconds
      10
    ),
    
    // ========================================================================
    // BEHAVIOR SETTINGS - Optimized for E-commerce
    // ========================================================================
    
    // Buffer commands when not connected
    bufferCommands: process.env.DB_BUFFER_COMMANDS !== 'false',
    
    // Maximum number of operations to buffer
    bufferMaxEntries: parseInt(
      process.env.DB_BUFFER_MAX_ENTRIES || '16', 
      10
    ),
    
    // Retry failed writes (important for order processing)
    retryWrites: process.env.DB_RETRY_WRITES !== 'false',
    
    // Retry failed reads
    retryReads: process.env.DB_RETRY_READS !== 'false',
    
    // ========================================================================
    // DATA CONSISTENCY SETTINGS - Critical for E-commerce
    // ========================================================================
    
    // Read concern level for data consistency
    readConcern: process.env.DB_READ_CONCERN || 'majority',
    
    // Write concern for data durability
    writeConcern: {
      // Write acknowledgment level
      w: process.env.DB_WRITE_CONCERN_W || 'majority',
      
      // Journal acknowledgment (ensures durability)
      j: process.env.DB_WRITE_CONCERN_J !== 'false',
      
      // Write concern timeout
      wtimeout: parseInt(
        process.env.DB_WRITE_CONCERN_TIMEOUT || '10000', // 10 seconds
        10
      ),
    },
    
    // ========================================================================
    // COMPRESSION - Network Efficiency
    // ========================================================================
    
    // Compression algorithms (reduces network traffic)
    compressors: process.env.DB_COMPRESSORS?.split(',') || ['snappy', 'zlib'],
    
    // ========================================================================
    // SECURITY SETTINGS
    // ========================================================================
    
    // Authentication database
    authSource: process.env.DB_AUTH_SOURCE || 'admin',
    
    // SSL/TLS encryption
    ssl: process.env.DB_SSL !== 'false',
    
    // Validate SSL certificates
    sslValidate: process.env.DB_SSL_VALIDATE !== 'false',
    
    // ========================================================================
    // MONITORING & DEBUGGING
    // ========================================================================
    
    // Monitor database commands (useful for debugging)
    monitorCommands: process.env.DB_MONITOR_COMMANDS === 'true' || !isProduction,
    
    // Mongoose logging level
    loggerLevel: process.env.DB_LOGGER_LEVEL || (isProduction ? 'error' : 'info'),
    
    // ========================================================================
    // PERFORMANCE OPTIMIZATION
    // ========================================================================
    
    // Automatically build indexes (disable in production for large collections)
    autoIndex: process.env.DB_AUTO_INDEX !== 'false' && !isProduction,
    
    // Automatically create collections
    autoCreate: process.env.DB_AUTO_CREATE !== 'false',
  };
});

// ============================================================================
// MONGODB BEST PRACTICES CONFIGURATION
// ============================================================================

/**
 * Additional MongoDB Configuration Tips:
 * 
 * 1. CONNECTION POOLING:
 *    - Use connection pooling to reuse connections
 *    - Monitor pool utilization in production
 *    - Adjust pool size based on concurrent users
 * 
 * 2. INDEXES:
 *    - Create compound indexes for complex queries
 *    - Use partial indexes for conditional data
 *    - Monitor index usage with db.collection.getIndexes()
 * 
 * 3. SCHEMA DESIGN:
 *    - Embed data that's accessed together
 *    - Reference data that's large or frequently updated
 *    - Consider document size limits (16MB)
 * 
 * 4. QUERY OPTIMIZATION:
 *    - Use .lean() for read-only operations
 *    - Implement proper pagination
 *    - Use projection to limit returned fields
 * 
 * 5. MONITORING:
 *    - Monitor slow queries
 *    - Track connection pool metrics
 *    - Set up alerts for connection failures
 * 
 * 6. SECURITY:
 *    - Use authentication and authorization
 *    - Enable SSL/TLS encryption
 *    - Implement IP whitelisting
 *    - Regular security audits
 */ 