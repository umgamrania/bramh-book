import { Pool } from "pg";

let pool: Pool;

const connectionString = process.env.DATABASE_URL;

if (process.env.NODE_ENV === "production") {
  pool = new Pool({
    connectionString,
  });
} else {
  // Prevent multiple pools from being created during hot-reloading in development
  const globalWithPool = global as typeof globalThis & {
    pgPool?: Pool;
  };
  if (!globalWithPool.pgPool) {
    globalWithPool.pgPool = new Pool({
      connectionString,
    });
  }
  pool = globalWithPool.pgPool;
}

export default pool;
