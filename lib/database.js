const { Pool } = require('pg');
const { attachDatabasePool } = require('@vercel/functions');
let pool;
function database() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    const error = new Error('Database belum terhubung.');
    error.status = 503;
    throw error;
  }
  if (!pool) {
    pool = new Pool({ connectionString, max: 3, connectionTimeoutMillis: 10000, idleTimeoutMillis: 10000 });
    if (process.env.VERCEL) attachDatabasePool(pool);
  }
  return pool;
}
module.exports = { database };
