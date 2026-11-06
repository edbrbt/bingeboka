// GET /api/config – offentlig: forteller klienten hvilken Google-klient som brukes.
const { lagHandler } = require('../lib/handler');
const { clientId } = require('../lib/auth');

module.exports = lagHandler({
  GET: async () => ({ googleClientId: clientId || null, utviklingsmodus: !clientId }),
}, { offentlig: true });
