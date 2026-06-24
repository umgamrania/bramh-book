import { Pool } from "pg";

let pool: Pool;

const connectionString = process.env.DATABASE_URL;

if (process.env.NODE_ENV === "production") {
  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Required for connecting to Supabase securely over SSL
    },
    // Serverless optimizations
    max: 4, // Keep max connections low in serverless environments
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
} else {
  // Prevent multiple pools from being created during hot-reloading in development
  const globalWithPool = global as typeof globalThis & {
    pgPool?: Pool;
  };

  if (!globalWithPool.pgPool) {
    globalWithPool.pgPool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }
  pool = globalWithPool.pgPool;
}

export default pool;
