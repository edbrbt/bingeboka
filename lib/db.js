// Databasetilgang. I produksjon: Postgres via DATABASE_URL (f.eks. Neon på Vercel).
// Lokalt uten DATABASE_URL: innebygd Postgres (PGlite) lagret i ./.lokaldata
const fs = require('fs');
const path = require('path');

let klient = null;

async function hentKlient() {
  if (klient) return klient;
  if (process.env.DATABASE_URL) {
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    klient = { query: async (text, params = []) => sql.query(text, params) };
  } else {
    const { PGlite } = await import('@electric-sql/pglite');
    const db = new PGlite(path.join(process.cwd(), '.lokaldata'));
    await db.exec(fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8'));
    klient = { query: async (text, params = []) => (await db.query(text, params)).rows };
  }
  return klient;
}

async function q(text, params) {
  return (await hentKlient()).query(text, params);
}

module.exports = { q };
