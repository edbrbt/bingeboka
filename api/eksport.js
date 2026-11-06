// GET /api/eksport – gjeldende plassering for alle aktive geiter som CSV
// (semikolon-separert, åpnes direkte i Google Regneark / Excel med norsk oppsett).
const { lagHandler } = require('../lib/handler');
const { q } = require('../lib/db');

module.exports = lagHandler({
  GET: async ({ res }) => {
    const rader = await q(`
      SELECT g.id, COALESCE(g.navn, '') AS navn, g.kategori,
             n.garde_id, n.tidspunkt
      FROM geit g LEFT JOIN naavaerende n ON n.geit_id = g.id
      WHERE g.aktiv ORDER BY n.garde_id NULLS LAST, g.id`);
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const linjer = [['Geit', 'Navn', 'Kategori', 'Garde', 'Sist registrert'].map(esc).join(';')];
    for (const r of rader) {
      const tid = r.tidspunkt ? new Date(r.tidspunkt).toLocaleString('nb-NO', { timeZone: 'Europe/Oslo' }) : '';
      linjer.push([r.id, r.navn, r.kategori, r.garde_id ?? '', tid].map(esc).join(';'));
    }
    const dato = new Date().toISOString().slice(0, 10);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="bingeboka-plasseringer-${dato}.csv"`);
    res.end('﻿' + linjer.join('\r\n'));
  },
});
