// Run explicitly before deploying. Re-running never overwrites existing data.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Pool } = require('pg');
const { hashPassword } = require('../lib/session');
async function main() {
  if (!process.env.DATABASE_URL_UNPOOLED) throw new Error('DATABASE_URL_UNPOOLED wajib diisi untuk migrasi.');
  const db = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED, max: 1 });
  await db.query(fs.readFileSync(path.join(__dirname, '../migrations/001-postgres.sql'), 'utf8'));
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(20260923)');
    const settings = require('../data_settings.json');
    await client.query('INSERT INTO sipintu_settings(id,data) VALUES(1,$1) ON CONFLICT DO NOTHING', [settings]);
    const context = { window: {}, localStorage: { getItem: () => null, setItem: () => {} }, console };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8'), context);
    // Seed only during the first initialization; deleting all articles stays deleted.
    const seeded = await client.query("SELECT data->>'articlesInitialized' AS done FROM sipintu_settings WHERE id=1");
    if (!seeded.rows[0].done) {
      for (const article of context.window.SchoolData.articles) {
        const { id, ...data } = article;
        await client.query('INSERT INTO sipintu_articles(data) VALUES($1)', [data]);
      }
      await client.query(`UPDATE sipintu_settings SET data=data || '{"articlesInitialized":true}'::jsonb WHERE id=1`);
    }
    const existing = await client.query('SELECT 1 FROM sipintu_admins LIMIT 1');
    if (!existing.rowCount) {
      if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12) throw new Error('Set ADMIN_PASSWORD minimal 12 karakter sebelum inisialisasi.');
      await client.query('INSERT INTO sipintu_admins(username,password_hash) VALUES($1,$2)', [process.env.ADMIN_USERNAME || 'admin', hashPassword(process.env.ADMIN_PASSWORD)]);
    }
    await client.query('COMMIT');
    console.log('Database initialized. Existing records preserved.');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); await db.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
