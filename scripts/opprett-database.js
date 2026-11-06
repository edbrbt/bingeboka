// Oppretter tabeller og garder i databasen som DATABASE_URL peker på.
// Trengs vanligvis ikke: appen gjør dette selv første gang den kobler til en tom database.
// Bruk: DATABASE_URL=postgres://... npm run db:opprett
const { neon } = require('@neondatabase/serverless');
const { skjemaSetninger } = require('../lib/db');

(async () => {
  if (!process.env.DATABASE_URL) {
    console.error('Sett DATABASE_URL først.');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  const setninger = skjemaSetninger();
  for (const s of setninger) await sql.query(s);
  console.log(`Ferdig: ${setninger.length} setninger kjørt.`);
})().catch((e) => { console.error(e); process.exit(1); });
