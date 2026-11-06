// Google-innlogging: klienten sender Google ID-token som "Authorization: Bearer <token>".
// Bare e-postadresser i TILLATTE_EPOSTER (kommaseparert) slipper inn.
const { OAuth2Client } = require('google-auth-library');

const clientId = process.env.GOOGLE_CLIENT_ID;
const oauth = clientId ? new OAuth2Client(clientId) : null;

function tillatte() {
  return (process.env.TILLATTE_EPOSTER || '')
    .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

// Returnerer e-post til innlogget bruker, eller kaster feil med status.
async function bruker(req) {
  if (!clientId) {
    // Utviklingsmodus lokalt: ingen innlogging. Aldri tillatt på Vercel.
    if (process.env.VERCEL) throw feil(500, 'GOOGLE_CLIENT_ID er ikke satt');
    return 'lokal@utvikling';
  }
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) throw feil(401, 'Ikke innlogget');
  let payload;
  try {
    const ticket = await oauth.verifyIdToken({ idToken: token, audience: clientId });
    payload = ticket.getPayload();
  } catch {
    throw feil(401, 'Innloggingen er utløpt');
  }
  const epost = (payload.email || '').toLowerCase();
  if (!payload.email_verified || !tillatte().includes(epost)) {
    throw feil(403, `${epost} har ikke tilgang til Bingeboka`);
  }
  return epost;
}

function feil(status, melding) {
  const e = new Error(melding);
  e.status = status;
  return e;
}

module.exports = { bruker, feil, clientId };
