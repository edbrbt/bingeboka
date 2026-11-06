// Felles innpakning for API-funksjoner: innlogging, JSON-body og feilhåndtering.
const { bruker } = require('./auth');

function lesBody(req) {
  if (req.body !== undefined) {
    return Promise.resolve(typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body);
  }
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function svar(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

function lagHandler(metoder, { offentlig = false } = {}) {
  return async (req, res) => {
    try {
      const fn = metoder[req.method];
      if (!fn) return svar(res, 405, { feil: 'Metode ikke støttet' });
      const url = new URL(req.url, 'http://x');
      const ctx = {
        query: Object.fromEntries(url.searchParams),
        body: req.method === 'POST' ? await lesBody(req) : {},
        bruker: offentlig ? null : await bruker(req),
        res,
      };
      const resultat = await fn(ctx);
      if (!res.writableEnded) svar(res, 200, resultat);
    } catch (e) {
      if (!e.status) console.error(e);
      svar(res, e.status || 500, { feil: e.status ? e.message : 'Uventet feil på serveren' });
    }
  };
}

module.exports = { lagHandler };
