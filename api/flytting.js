// POST /api/flytting – registrerer at én geit er flyttet, utenom faste gjennomganger.
// Body: { klientId, geitId, gardeId, tidspunkt }
const { lagHandler } = require('../lib/handler');
const { feil } = require('../lib/auth');
const { q } = require('../lib/db');

module.exports = lagHandler({
  POST: async ({ body, bruker }) => {
    const { klientId, gardeId, tidspunkt } = body;
    const geitId = String(body.geitId || '').trim();
    if (!klientId || !geitId || !gardeId || !tidspunkt) throw feil(400, 'Mangler felt');
    await q(`INSERT INTO geit (id) VALUES ($1) ON CONFLICT (id) DO UPDATE SET aktiv = TRUE`, [geitId]);
    await q(`
      INSERT INTO plassering (klient_id, geit_id, garde_id, tidspunkt, kilde, registrert_av)
      VALUES ($1, $2, $3, $4, 'flytting', $5) ON CONFLICT (klient_id) DO NOTHING`,
      [klientId, geitId, gardeId, tidspunkt, bruker]);
    return { ok: true };
  },
});
