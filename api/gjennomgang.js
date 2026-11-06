// POST /api/gjennomgang – lagrer en gjennomgang av ett garde.
// Body: { klientId, gardeId, tidspunkt, geiter: ["1234", ...], merknad? }
// Trygg å sende flere ganger (klientId gjør at ingenting lagres dobbelt).
const { lagHandler } = require('../lib/handler');
const { feil } = require('../lib/auth');
const { q } = require('../lib/db');

module.exports = lagHandler({
  POST: async ({ body, bruker }) => {
    const { klientId, gardeId, tidspunkt, merknad } = body;
    const geiter = [...new Set((body.geiter || []).map((g) => String(g).trim()).filter(Boolean))];
    if (!klientId || !gardeId || !tidspunkt) throw feil(400, 'Mangler klientId, gardeId eller tidspunkt');

    const garde = await q('SELECT id FROM garde WHERE id = $1', [gardeId]);
    if (!garde.length) throw feil(400, `Garde ${gardeId} finnes ikke`);

    // Nye geiter opprettes automatisk; inaktive geiter som dukker opp igjen, aktiveres.
    if (geiter.length) {
      await q(`INSERT INTO geit (id) SELECT unnest($1::text[])
               ON CONFLICT (id) DO UPDATE SET aktiv = TRUE`, [geiter]);
    }

    let rad = await q(`
      INSERT INTO gjennomgang (klient_id, garde_id, tidspunkt, registrert_av, antall, merknad)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (klient_id) DO NOTHING RETURNING id`,
      [klientId, gardeId, tidspunkt, bruker, geiter.length, merknad || null]);
    if (!rad.length) rad = await q('SELECT id FROM gjennomgang WHERE klient_id = $1', [klientId]);
    const gjennomgangId = rad[0].id;

    if (geiter.length) {
      await q(`
        INSERT INTO plassering (klient_id, geit_id, garde_id, tidspunkt, kilde, gjennomgang_id, registrert_av)
        SELECT $1 || ':' || g, g, $2, $3, 'gjennomgang', $4, $5 FROM unnest($6::text[]) AS g
        ON CONFLICT (klient_id) DO NOTHING`,
        [klientId, gardeId, tidspunkt, gjennomgangId, bruker, geiter]);
    }
    return { ok: true, gjennomgangId, antall: geiter.length };
  },
});
