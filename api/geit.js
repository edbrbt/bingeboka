// GET  /api/geit?id=1234 – én geit med plasseringshistorikk
// POST /api/geit         – oppdater navn, kategori, merknad eller aktiv (f.eks. utrangert)
const { lagHandler } = require('../lib/handler');
const { feil } = require('../lib/auth');
const { q } = require('../lib/db');

const KATEGORIER = ['melkegeit', 'påsett', 'bukk'];

module.exports = lagHandler({
  GET: async ({ query }) => {
    const id = String(query.id || '').trim();
    const geit = await q('SELECT id, navn, kategori, aktiv, merknad FROM geit WHERE id = $1', [id]);
    if (!geit.length) throw feil(404, `Fant ingen geit med ID ${id}`);
    const historikk = await q(`
      SELECT garde_id, tidspunkt, kilde, registrert_av FROM plassering
      WHERE geit_id = $1 ORDER BY tidspunkt DESC, id DESC LIMIT 100`, [id]);
    return { ...geit[0], historikk };
  },
  POST: async ({ body }) => {
    const id = String(body.id || '').trim();
    if (!id) throw feil(400, 'Mangler ID');
    if (body.kategori && !KATEGORIER.includes(body.kategori)) throw feil(400, 'Ugyldig kategori');
    await q(`
      INSERT INTO geit (id, navn, kategori, aktiv, merknad)
      VALUES ($1, $2, COALESCE($3, 'melkegeit'), COALESCE($4, TRUE), $5)
      ON CONFLICT (id) DO UPDATE SET
        navn = COALESCE($2, geit.navn),
        kategori = COALESCE($3, geit.kategori),
        aktiv = COALESCE($4, geit.aktiv),
        merknad = COALESCE($5, geit.merknad)`,
      [id, body.navn ?? null, body.kategori ?? null, body.aktiv ?? null, body.merknad ?? null]);
    return { ok: true };
  },
});
