// Oppretter tabeller og garder i databasen som DATABASE_URL peker på.
// Bruk: DATABASE_URL=postgres://... npm run db:opprett
const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

(async () => {
  if (!process.env.DATABASE_URL) {
    console.error('Sett DATABASE_URL først.');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  const skjema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  // Del opp i enkeltsetninger (skjemaet har ingen semikolon inne i strenger).
  const setninger = skjema.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
  for (const s of setninger) await sql.query(s);
  console.log(`Ferdig: ${setninger.length} setninger kjørt.`);
})().catch((e) => { console.error(e); process.exit(1); });
