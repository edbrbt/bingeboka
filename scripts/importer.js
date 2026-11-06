// Importerer dagens plasseringer fra regnearket (eksportert som CSV).
// CSV-en må ha kolonnene "Geit" og "Garde" (overskriftsrad, komma eller semikolon).
// Valgfrie kolonner: "Navn", "Kategori", "Dato" (ÅÅÅÅ-MM-DD eller DD.MM.ÅÅÅÅ).
//
// Bruk:  node scripts/importer.js plasseringer.csv            (lokal database)
//        DATABASE_URL=postgres://... node scripts/importer.js plasseringer.csv
const fs = require('fs');
const { q } = require('../lib/db');

function tilDato(s) {
  if (!s) return new Date().toISOString();
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  return new Date(m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}T12:00:00` : s).toISOString();
}

(async () => {
  const fil = process.argv[2];
  if (!fil) { console.error('Bruk: node scripts/importer.js <fil.csv>'); process.exit(1); }
  const linjer = fs.readFileSync(fil, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  const sep = linjer[0].includes(';') ? ';' : ',';
  const kol = linjer[0].split(sep).map((k) => k.replace(/"/g, '').trim().toLowerCase());
  const i = (navn) => kol.indexOf(navn);
  if (i('geit') < 0 || i('garde') < 0) throw new Error('Fant ikke kolonnene "Geit" og "Garde"');

  let antall = 0;
  for (const linje of linjer.slice(1)) {
    const c = linje.split(sep).map((v) => v.replace(/"/g, '').trim());
    const geit = c[i('geit')];
    const garde = parseInt(c[i('garde')], 10);
    if (!geit || !(garde >= 1 && garde <= 11)) continue;
    await q(`INSERT INTO geit (id, navn, kategori) VALUES ($1, NULLIF($2, ''), COALESCE(NULLIF($3, ''), 'melkegeit'))
             ON CONFLICT (id) DO NOTHING`, [geit, c[i('navn')] || '', c[i('kategori')] || '']);
    await q(`INSERT INTO plassering (klient_id, geit_id, garde_id, tidspunkt, kilde, registrert_av)
             VALUES ($1, $2, $3, $4, 'gjennomgang', 'import') ON CONFLICT (klient_id) DO NOTHING`,
      [`import:${geit}:${garde}`, geit, garde, tilDato(c[i('dato')])]);
    antall++;
  }
  console.log(`Importerte ${antall} plasseringer.`);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
