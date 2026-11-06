// GET /api/data – alt telefonen trenger for å jobbe (også uten nett):
// garder med siste gjennomgang, og alle aktive geiter med nåværende garde.
const { lagHandler } = require('../lib/handler');
const { q } = require('../lib/db');

module.exports = lagHandler({
  GET: async ({ bruker }) => {
    const garder = await q(`
      SELECT g.id, g.del, g.plasser, g.binge,
             sg.tidspunkt AS sist_gjennomgatt, sg.registrert_av AS sist_av
      FROM garde g
      LEFT JOIN LATERAL (
        SELECT tidspunkt, registrert_av FROM gjennomgang
        WHERE garde_id = g.id ORDER BY tidspunkt DESC LIMIT 1
      ) sg ON true
      ORDER BY g.sortering`);
    const geiter = await q(`
      SELECT g.id, g.navn, g.kategori, n.garde_id, n.tidspunkt AS sist_sett
      FROM geit g LEFT JOIN naavaerende n ON n.geit_id = g.id
      WHERE g.aktiv
      ORDER BY g.id`);
    return { bruker, garder, geiter, hentet: new Date().toISOString() };
  },
});
