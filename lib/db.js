// Databasetilgang. I produksjon: Postgres via DATABASE_URL (f.eks. Neon på Vercel).
// Lokalt uten DATABASE_URL: innebygd Postgres (PGlite) lagret i ./.lokaldata
// Tabellene opprettes automatisk første gang appen kobler til en tom database.
const fs = require('fs');
const path = require('path');

const SKJEMA = path.join(__dirname, '..', 'db', 'schema.sql');
let klient = null;

function skjemaSetninger() {
  // Skjemaet har ingen semikolon inne i strenger, så enkel oppdeling holder.
  return fs.readFileSync(SKJEMA, 'utf8').replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
}

async function hentKlient() {
  if (klient) return klient;
  if (process.env.DATABASE_URL) {
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    const k = { query: async (text, params = []) => sql.query(text, params) };
    const [{ finnes }] = await k.query("SELECT to_regclass('public.plassering') IS NOT NULL AS finnes");
    if (!finnes) {
      for (const s of skjemaSetninger()) await k.query(s);
      console.log('Bingeboka: databasetabeller opprettet');
    }
    klient = k;
  } else {
    const { PGlite } = await import('@electric-sql/pglite');
    const db = new PGlite(path.join(process.cwd(), '.lokaldata'));
    await db.exec(fs.readFileSync(SKJEMA, 'utf8'));
    klient = { query: async (text, params = []) => (await db.query(text, params)).rows };
  }
  return klient;
}

async function q(text, params) {
  return (await hentKlient()).query(text, params);
}

module.exports = { q, skjemaSetninger };
