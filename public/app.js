/* Bingeboka – plassering av geiter i garder.
 * Virker uten nett: data hentes og mellomlagres på telefonen, og registreringer
 * legges i en kø som sendes når det er dekning. */
'use strict';

const $ = (sel, el = document) => el.querySelector(sel);
const innhold = $('#innhold');
const LAGER = { data: 'bb.data', ko: 'bb.ko', token: 'bb.token', utkast: 'bb.utkast.' };

const tilstand = {
  config: null,
  data: les(LAGER.data) || null,
  ko: les(LAGER.ko) || [],
  synker: false,
  synkFeil: null,
};

// ---------- hjelpere ----------
function les(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function skriv(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* fullt lager */ } }
function fjern(k) { try { localStorage.removeItem(k); } catch { /* ignorer */ } }
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function uuid() {
  return (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function normId(s) { return String(s || '').trim().replace(/\s+/g, '').toUpperCase(); }
function nar(iso) {
  if (!iso) return 'aldri';
  const d = new Date(iso);
  const dager = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 864e5);
  const kl = d.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
  if (dager <= 0) return `i dag ${kl}`;
  if (dager === 1) return `i går ${kl}`;
  if (dager < 14) return `${dager} dager siden`;
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });
}
function dagerSiden(iso) { return iso ? (Date.now() - new Date(iso)) / 864e5 : Infinity; }
let meldingTimer;
function vis(tekst, ms = 2800) {
  const m = $('#melding');
  m.textContent = tekst; m.hidden = false;
  clearTimeout(meldingTimer);
  meldingTimer = setTimeout(() => { m.hidden = true; }, ms);
}
function vibrer(ms = 15) { try { navigator.vibrate && navigator.vibrate(ms); } catch { /* ignorer */ } }

// ---------- innlogging (Google) ----------
function token() {
  const t = les(LAGER.token);
  return t && t.utloper > Date.now() + 60e3 ? t.verdi : null;
}
function lagreToken(verdi) {
  const payload = JSON.parse(atob(verdi.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  skriv(LAGER.token, { verdi, utloper: payload.exp * 1000, epost: payload.email });
}
function lastGoogle() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}
async function visInnlogging(feilmelding) {
  $('#bunnmeny').hidden = true;
  innhold.innerHTML = `
    <div class="innlogging">
      <img src="/ikon.svg" alt="">
      <h1>Bingeboka</h1>
      <p class="hjelp">Hvor står geitene? Logg inn med Google-kontoen din.</p>
      ${feilmelding ? `<div class="varsel raud">${esc(feilmelding)}</div>` : ''}
      <div id="googleknapp"></div>
    </div>`;
  try {
    await lastGoogle();
    google.accounts.id.initialize({
      client_id: tilstand.config.googleClientId,
      auto_select: true,
      callback: async ({ credential }) => {
        lagreToken(credential);
        $('#bunnmeny').hidden = false;
        await synk();
        rute();
      },
    });
    google.accounts.id.renderButton($('#googleknapp'), { theme: 'filled_blue', size: 'large', shape: 'pill', text: 'signin_with', locale: 'nb' });
    google.accounts.id.prompt();
  } catch {
    $('#googleknapp').innerHTML = '<p class="varsel gul">Får ikke kontakt med Google. Sjekk nettforbindelsen.</p>';
  }
}
function trengerInnlogging() { return tilstand.config?.googleClientId && !token(); }

// ---------- API og synk ----------
async function api(sti, valg = {}) {
  const hoder = { 'Content-Type': 'application/json' };
  const t = token();
  if (t) hoder.Authorization = `Bearer ${t}`;
  const svar = await fetch(sti, { ...valg, headers: hoder });
  if (svar.status === 401) { fjern(LAGER.token); const e = new Error('Innlogging utløpt'); e.status = 401; throw e; }
  if (!svar.ok) {
    let m = `Feil ${svar.status}`;
    try { m = (await svar.json()).feil || m; } catch { /* ignorer */ }
    const e = new Error(m); e.status = svar.status; throw e;
  }
  return svar;
}

function leggIKo(element) {
  tilstand.ko.push(element);
  skriv(LAGER.ko, tilstand.ko);
  anvend(tilstand.data, element);
  skriv(LAGER.data, tilstand.data);
  oppdaterSynkstatus();
  synk();
}

// Legger en registrering inn i lokale data, så appen viser den med en gang.
function anvend(data, el) {
  if (!data) return;
  const finnEllerLag = (id) => {
    let g = data.geiter.find((x) => x.id === id);
    if (!g) { g = { id, navn: null, kategori: 'melkegeit', garde_id: null, sist_sett: null }; data.geiter.push(g); }
    return g;
  };
  if (el.type === 'gjennomgang') {
    for (const id of el.body.geiter) {
      const g = finnEllerLag(id);
      g.garde_id = el.body.gardeId; g.sist_sett = el.body.tidspunkt;
    }
    const garde = data.garder.find((x) => x.id === el.body.gardeId);
    if (garde && (!garde.sist_gjennomgatt || garde.sist_gjennomgatt < el.body.tidspunkt)) garde.sist_gjennomgatt = el.body.tidspunkt;
  } else if (el.type === 'flytting') {
    const g = finnEllerLag(el.body.geitId);
    g.garde_id = el.body.gardeId; g.sist_sett = el.body.tidspunkt;
  } else if (el.type === 'geit') {
    const g = finnEllerLag(el.body.id);
    Object.assign(g, Object.fromEntries(Object.entries(el.body).filter(([, v]) => v !== undefined && v !== null)));
    if (el.body.aktiv === false) data.geiter = data.geiter.filter((x) => x.id !== el.body.id);
  }
}

async function hentData() {
  const data = await (await api('/api/data')).json();
  for (const el of tilstand.ko) anvend(data, el); // ikke-sendte registreringer vises fortsatt
  tilstand.data = data;
  skriv(LAGER.data, data);
}

async function synk() {
  if (tilstand.synker || trengerInnlogging()) return oppdaterSynkstatus();
  if (!navigator.onLine) return oppdaterSynkstatus();
  tilstand.synker = true; oppdaterSynkstatus();
  try {
    while (tilstand.ko.length) {
      const el = tilstand.ko[0];
      const sti = { gjennomgang: '/api/gjennomgang', flytting: '/api/flytting', geit: '/api/geit' }[el.type];
      try {
        await api(sti, { method: 'POST', body: JSON.stringify(el.body) });
      } catch (e) {
        // Feil i selve registreringen (400) blokkerer ikke resten av køen.
        if (e.status !== 400) throw e;
        vis(`En registrering ble avvist: ${e.message}`, 6000);
      }
      tilstand.ko.shift();
      skriv(LAGER.ko, tilstand.ko);
    }
    await hentData();
    tilstand.synkFeil = null;
  } catch (e) {
    tilstand.synkFeil = e.message;
    if (e.status === 401 && tilstand.config?.googleClientId) { tilstand.synker = false; return visInnlogging('Innloggingen er utløpt. Logg inn igjen.'); }
  } finally {
    tilstand.synker = false;
    oppdaterSynkstatus();
  }
  if (location.hash === '' || location.hash === '#/') rute();
}

function oppdaterSynkstatus() {
  const k = $('#synkstatus');
  const n = tilstand.ko.length;
  k.className = 'synk';
  if (tilstand.synker) k.textContent = 'Synker …';
  else if (n) { k.textContent = `${n} venter på nett`; k.classList.add('venter'); }
  else if (!navigator.onLine) k.textContent = 'Uten nett';
  else if (tilstand.synkFeil) { k.textContent = 'Ikke synket'; k.classList.add('feil'); }
  else k.textContent = 'Alt lagret ✓';
}

// ---------- utledede data ----------
function garde(id) { return tilstand.data.garder.find((g) => g.id === id); }
function geit(id) { return tilstand.data.geiter.find((g) => g.id === id); }
function geiterI(gardeId) { return tilstand.data.geiter.filter((g) => g.garde_id === gardeId); }

// ---------- visninger ----------
function visOversikt() {
  const d = tilstand.data;
  const kort = (g) => {
    const n = geiterI(g.id).length;
    const pst = Math.min(100, Math.round((n / g.plasser) * 100));
    const gammel = dagerSiden(g.sist_gjennomgatt) > 30;
    return `
      <a class="kort" href="#/garde/${g.id}">
        <div class="nr">${g.id}${g.binge === '9-10' ? '<small>felles binge</small>' : ''}</div>
        <div class="belegg">${n} / ${g.plasser}</div>
        <div class="stolpe ${n > g.plasser ? 'full' : ''}"><span style="width:${pst}%"></span></div>
        <div class="sist ${gammel ? 'gammel' : ''}">Sist: ${nar(g.sist_gjennomgatt)}</div>
      </a>`;
  };
  const del = (navn) => d.garder.filter((g) => g.del === navn);
  const sum = (navn) => del(navn).reduce((s, g) => s + geiterI(g.id).length, 0);
  const plasser = (navn) => del(navn).reduce((s, g) => s + g.plasser, 0);
  const binge910 = geiterI(9).length + geiterI(10).length;
  const utenGarde = d.geiter.filter((g) => !g.garde_id).length;
  innhold.innerHTML = `
    <h1>Garder</h1>
    <p class="hjelp">Trykk på et garde for å starte en gjennomgang når det står i melkestallen.</p>
    <h2>Nord · garde 1–6 · ${sum('nord')} / ${plasser('nord')}</h2>
    <div class="rutenett">${del('nord').map(kort).join('')}</div>
    <h2>Sør · garde 7–11 · ${sum('sor')} / ${plasser('sor')}</h2>
    <div class="rutenett">${del('sor').map(kort).join('')}</div>
    <p class="binge-merk">Felles binge 9–10: ${binge910} / 48</p>
    ${utenGarde ? `<p class="binge-merk">${utenGarde} geit${utenGarde === 1 ? '' : 'er'} uten registrert garde.</p>` : ''}
  `;
}

// En gjennomgang holdes i et utkast som lagres løpende, så ingenting går tapt
// om telefonen låses eller appen lukkes midt i.
function hentUtkast(gardeId) {
  const u = les(LAGER.utkast + gardeId);
  if (u) return u;
  return {
    gardeId,
    startet: new Date().toISOString(),
    forventet: geiterI(gardeId).map((g) => g.id).sort((a, b) => a.localeCompare(b, 'nb', { numeric: true })),
    tilstede: [], // i den rekkefølgen de ble registrert
  };
}

function visGjennomgang(gardeId) {
  const g = garde(gardeId);
  if (!g) { location.hash = '#/'; return; }
  const u = hentUtkast(gardeId);
  const lagre = () => skriv(LAGER.utkast + gardeId, u);

  innhold.innerHTML = `
    <div class="gardehode">
      <h1>Garde ${g.id}</h1>
      <div class="teller" id="teller"></div>
    </div>
    <p class="hjelp">Skriv inn ID-en til hver geit i melkestallen, eller kryss av i lista under.</p>
    <div class="inntasting">
      <form id="skjema" autocomplete="off">
        <input id="idfelt" inputmode="numeric" enterkeyhint="done" placeholder="Geit-ID" aria-label="Geit-ID" autocapitalize="characters">
        <button class="knapp" type="submit">Legg til</button>
      </form>
      <div class="forslag" id="forslag"></div>
    </div>
    <div id="varsler"></div>
    <ul class="liste" id="liste"></ul>
    <div class="handlinger">
      <button class="knapp sekundar" id="avbryt" type="button">Avbryt</button>
      <button class="knapp" id="fullfor" type="button">Fullfør</button>
    </div>`;

  const felt = $('#idfelt');

  function tegn() {
    const sett = new Set(u.tilstede);
    const n = u.tilstede.length;
    $('#teller').innerHTML = `${n}<small> / ${g.plasser}</small>`;
    $('#teller').className = `teller ${n > g.plasser ? 'over' : ''}`;

    const varsler = [];
    if (n > g.plasser) varsler.push(`<div class="varsel raud">Flere geiter (${n}) enn plasser i gardet (${g.plasser}).</div>`);
    $('#varsler').innerHTML = varsler.join('');

    // Registrerte først (nyeste øverst), deretter de som ikke er sett ennå.
    const ikkeSett = u.forventet.filter((id) => !sett.has(id));
    const rader = [...u.tilstede].reverse().map((id) => rad(id, true)).concat(ikkeSett.map((id) => rad(id, false)));
    $('#liste').innerHTML = rader.join('') || '<li class="tom">Ingen geiter registrert i dette gardet ennå.</li>';
  }

  function rad(id, tilstede) {
    const gt = geit(id);
    let merke = '';
    if (tilstede && !u.forventet.includes(id)) {
      merke = !gt ? '<span class="merke ny">Ny geit</span>'
        : gt.garde_id && gt.garde_id !== gardeId ? `<span class="merke flyttet">Fra garde ${gt.garde_id}</span>`
          : '<span class="merke flyttet">Inn i gardet</span>';
    }
    return `
      <li><button type="button" class="rad ${tilstede ? 'tilstede' : ''}" data-id="${esc(id)}">
        <span class="boks">${tilstede ? '✓' : ''}</span>
        <span><span class="id">${esc(id)}</span>${gt?.navn ? ` <span class="navn">${esc(gt.navn)}</span>` : ''}</span>
        ${merke}
      </button></li>`;
  }

  function registrer(raa) {
    const id = normId(raa);
    if (!id) return;
    if (u.tilstede.includes(id)) {
      vis(`${id} er allerede registrert`);
    } else {
      u.tilstede.push(id);
      lagre(); vibrer();
      const gt = geit(id);
      if (!gt) vis(`${id} er ukjent – blir lagt til som ny geit`);
      else if (gt.garde_id && gt.garde_id !== gardeId) vis(`${id} sto sist i garde ${gt.garde_id}`);
    }
    felt.value = ''; $('#forslag').innerHTML = '';
    tegn();
  }

  felt.addEventListener('input', () => {
    const s = normId(felt.value);
    if (!s) { $('#forslag').innerHTML = ''; return; }
    const sett = new Set(u.tilstede);
    const kandidater = tilstand.data.geiter.map((x) => x.id).filter((id) => !sett.has(id) && id.includes(s));
    // Geiter som forventes i gardet, og treff i starten av ID-en, kommer først.
    kandidater.sort((a, b) => (u.forventet.includes(b) - u.forventet.includes(a)) || (b.startsWith(s) - a.startsWith(s)) || a.localeCompare(b, 'nb', { numeric: true }));
    $('#forslag').innerHTML = kandidater.slice(0, 6).map((id) => `<button type="button" data-id="${esc(id)}">${esc(id)}</button>`).join('');
  });
  $('#forslag').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (b) { registrer(b.dataset.id); felt.focus(); }
  });
  $('#skjema').addEventListener('submit', (e) => { e.preventDefault(); registrer(felt.value); felt.focus(); });
  $('#liste').addEventListener('click', (e) => {
    const b = e.target.closest('.rad'); if (!b) return;
    const id = b.dataset.id;
    if (u.tilstede.includes(id)) u.tilstede = u.tilstede.filter((x) => x !== id);
    else { u.tilstede.push(id); vibrer(); }
    lagre(); tegn();
  });
  $('#avbryt').addEventListener('click', () => {
    if (u.tilstede.length && !confirm('Forkaste denne gjennomgangen?')) return;
    fjern(LAGER.utkast + gardeId); location.hash = '#/';
  });
  $('#fullfor').addEventListener('click', () => visOppsummering(g, u));

  tegn();
}

function visOppsummering(g, u) {
  const sett = new Set(u.tilstede);
  const nye = u.tilstede.filter((id) => !geit(id));
  const innflyttet = u.tilstede.filter((id) => geit(id) && !u.forventet.includes(id));
  const ikkeSett = u.forventet.filter((id) => !sett.has(id));
  const brikker = (l) => `<div class="brikker">${l.map((id) => {
    const fra = geit(id)?.garde_id;
    return `<span class="brikke">${esc(id)}${fra && fra !== g.id ? ` <span class="liten">fra ${fra}</span>` : ''}</span>`;
  }).join('')}</div>`;

  innhold.innerHTML = `
    <h1>Garde ${g.id} – oppsummering</h1>
    <p class="hjelp">Se over før du lagrer.</p>
    <div class="oppsummering">
      <div class="tal">
        <div><b>${u.tilstede.length}</b><span>til stede</span></div>
        <div><b>${innflyttet.length + nye.length}</b><span>nye i gardet</span></div>
        <div><b>${ikkeSett.length}</b><span>ikke sett</span></div>
      </div>
      ${u.tilstede.length > g.plasser ? `<div class="varsel raud">Flere geiter enn plasser (${g.plasser}).</div>` : ''}
      ${innflyttet.length ? `<h3>Flyttet inn i gardet</h3>${brikker(innflyttet)}` : ''}
      ${nye.length ? `<h3>Ukjente – legges til som nye geiter</h3>${brikker(nye)}` : ''}
      ${ikkeSett.length ? `<h3>Ikke sett denne gangen</h3>${brikker(ikkeSett)}
        <p class="liten">Disse står fortsatt registrert i garde ${g.id} til de blir sett et annet sted.</p>` : ''}
      ${!u.tilstede.length ? '<div class="varsel gul">Ingen geiter er registrert.</div>' : ''}
    </div>
    <div class="handlinger">
      <button class="knapp sekundar" id="tilbake" type="button">Tilbake</button>
      <button class="knapp" id="lagre" type="button" ${u.tilstede.length ? '' : 'disabled'}>Lagre</button>
    </div>`;

  $('#tilbake').addEventListener('click', () => visGjennomgang(g.id));
  $('#lagre').addEventListener('click', () => {
    leggIKo({
      type: 'gjennomgang',
      body: { klientId: uuid(), gardeId: g.id, tidspunkt: new Date().toISOString(), geiter: u.tilstede },
    });
    fjern(LAGER.utkast + g.id);
    vis(`Garde ${g.id} lagret${navigator.onLine ? '' : ' – sendes når du får nett'}`);
    location.hash = '#/';
  });
}

function visFinn(forhandsvalgt) {
  innhold.innerHTML = `
    <h1>Finn geit</h1>
    <div class="inntasting">
      <form id="sok" autocomplete="off">
        <input id="sokefelt" inputmode="numeric" enterkeyhint="search" placeholder="Geit-ID eller navn" aria-label="Geit-ID eller navn">
        <button class="knapp" type="submit">Finn</button>
      </form>
      <div class="forslag" id="forslag"></div>
    </div>
    <div id="resultat"></div>`;
  const felt = $('#sokefelt');
  felt.addEventListener('input', () => {
    const s = felt.value.trim().toLowerCase();
    if (!s) { $('#forslag').innerHTML = ''; return; }
    const treff = tilstand.data.geiter.filter((x) => x.id.toLowerCase().includes(s) || (x.navn || '').toLowerCase().includes(s)).slice(0, 8);
    $('#forslag').innerHTML = treff.map((x) => `<button type="button" data-id="${esc(x.id)}">${esc(x.id)}${x.navn ? ` · ${esc(x.navn)}` : ''}</button>`).join('');
  });
  $('#forslag').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) visGeit(b.dataset.id); });
  $('#sok').addEventListener('submit', (e) => { e.preventDefault(); visGeit(normId(felt.value)); });
  if (forhandsvalgt) visGeit(forhandsvalgt); else felt.focus();
}

async function visGeit(id) {
  if (!id) return;
  $('#forslag').innerHTML = '';
  $('#sokefelt').value = id;
  const gt = geit(id);
  const res = $('#resultat');
  if (!gt) {
    res.innerHTML = `<div class="geitkort"><div class="stor">${esc(id)}</div>
      <p>Finnes ikke i besetningen. Du kan registrere hvor den står:</p>${gardeknapper(null)}</div>`;
  } else {
    res.innerHTML = `
      <div class="geitkort">
        <div class="stor">${esc(gt.id)}</div>
        <dl>
          <dt>Garde</dt><dd>${gt.garde_id ? `<a href="#/garde/${gt.garde_id}">Garde ${gt.garde_id}</a>` : 'Ikke registrert'}</dd>
          <dt>Sist sett</dt><dd>${nar(gt.sist_sett)}</dd>
          <dt>Kategori</dt><dd>${esc(gt.kategori || 'melkegeit')}</dd>
          ${gt.navn ? `<dt>Navn</dt><dd>${esc(gt.navn)}</dd>` : ''}
        </dl>
        <h3>Flytt til garde</h3>
        ${gardeknapper(gt.garde_id)}
        <h3>Historikk</h3>
        <div id="historikk" class="liten">Henter …</div>
        <h3>Opplysninger</h3>
        <label class="felt">Navn<input id="navn" value="${esc(gt.navn || '')}"></label>
        <label class="felt">Kategori
          <select id="kategori">${['melkegeit', 'påsett', 'bukk'].map((k) => `<option ${k === gt.kategori ? 'selected' : ''}>${k}</option>`).join('')}</select>
        </label>
        <div class="handlinger">
          <button class="knapp sekundar" id="ut" type="button">Ta ut av besetningen</button>
          <button class="knapp" id="lagregeit" type="button">Lagre</button>
        </div>
      </div>`;
    $('#lagregeit').addEventListener('click', () => {
      leggIKo({ type: 'geit', body: { id: gt.id, navn: $('#navn').value.trim() || null, kategori: $('#kategori').value } });
      vis('Lagret'); visGeit(gt.id);
    });
    $('#ut').addEventListener('click', () => {
      if (!confirm(`Ta ${gt.id} ut av besetningen? Den vises ikke lenger i garder og lister.`)) return;
      leggIKo({ type: 'geit', body: { id: gt.id, aktiv: false } });
      vis(`${gt.id} er tatt ut`); visFinn();
    });
    hentHistorikk(gt.id);
  }
  res.querySelectorAll('.gardevalg button').forEach((b) => b.addEventListener('click', () => {
    const til = Number(b.dataset.garde);
    if (gt?.garde_id === til) return;
    leggIKo({ type: 'flytting', body: { klientId: uuid(), geitId: id, gardeId: til, tidspunkt: new Date().toISOString() } });
    vibrer(); vis(`${id} er registrert i garde ${til}`);
    visGeit(id);
  }));
}

function gardeknapper(navarende) {
  return `<div class="gardevalg">${tilstand.data.garder.map((g) =>
    `<button type="button" data-garde="${g.id}" class="${g.id === navarende ? 'valgt' : ''}">${g.id}</button>`).join('')}</div>`;
}

async function hentHistorikk(id) {
  const el = $('#historikk');
  if (!navigator.onLine) { el.textContent = 'Historikk vises når du har nett.'; return; }
  try {
    const g = await (await api(`/api/geit?id=${encodeURIComponent(id)}`)).json();
    if (!document.body.contains(el)) return;
    el.outerHTML = g.historikk.length ? `<ul class="historikk">${g.historikk.map((h) => `
      <li><span>Garde ${h.garde_id} <span class="liten">${h.kilde === 'flytting' ? '(flyttet)' : ''}</span></span>
      <span class="liten">${nar(h.tidspunkt)}</span></li>`).join('')}</ul>` : '<p class="liten">Ingen registreringer ennå.</p>';
  } catch (e) {
    el.textContent = e.status === 404 ? 'Ikke lagret på serveren ennå.' : 'Kunne ikke hente historikk.';
  }
}

function visMer() {
  const t = les(LAGER.token);
  innhold.innerHTML = `
    <h1>Mer</h1>
    <h2>Data</h2>
    <ul class="meny">
      <li><button id="eksport" type="button">Last ned plasseringer (CSV for regneark)</button></li>
      <li><button id="synknaa" type="button">Synkroniser nå</button></li>
    </ul>
    <h2>Konto</h2>
    <ul class="meny">
      <li><div style="padding:16px">${esc(t?.epost || tilstand.data?.bruker || '–')}
        ${tilstand.config?.utviklingsmodus ? '<div class="liten">Utviklingsmodus – innlogging er slått av</div>' : ''}</div></li>
      ${tilstand.config?.googleClientId ? '<li><button id="loggut" type="button">Logg ut</button></li>' : ''}
    </ul>
    <p class="liten" style="margin-top:20px">Bingeboka 0.1 · ${tilstand.data?.geiter.length ?? 0} aktive geiter ·
      data hentet ${nar(tilstand.data?.hentet)}</p>`;
  $('#eksport').addEventListener('click', async () => {
    try {
      const blob = await (await api('/api/eksport')).blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `bingeboka-plasseringer-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch (e) { vis(`Kunne ikke laste ned: ${e.message}`); }
  });
  $('#synknaa').addEventListener('click', async () => { await synk(); vis(tilstand.synkFeil ? `Synk feilet: ${tilstand.synkFeil}` : 'Alt er synkronisert'); });
  $('#loggut')?.addEventListener('click', () => {
    if (tilstand.ko.length && !confirm(`${tilstand.ko.length} registreringer er ikke sendt ennå. Logge ut likevel?`)) return;
    fjern(LAGER.token);
    try { google.accounts.id.disableAutoSelect(); } catch { /* ignorer */ }
    visInnlogging();
  });
}

// ---------- ruting ----------
function rute() {
  if (trengerInnlogging() && navigator.onLine) return visInnlogging();
  $('#bunnmeny').hidden = false;
  if (!tilstand.data) {
    innhold.innerHTML = `<p class="tom">${navigator.onLine ? 'Henter data …' : 'Ingen data på telefonen ennå. Koble til nett én gang først.'}</p>`;
    return;
  }
  const [, side, arg] = (location.hash.replace(/^#\/?/, '/') || '/').split('/');
  document.querySelectorAll('.bunn a').forEach((a) => a.classList.toggle('aktiv',
    a.dataset.fane === ({ '': 'oversikt', garde: 'oversikt', finn: 'finn', mer: 'mer' }[side || ''])));
  window.scrollTo(0, 0);
  if (side === 'garde') visGjennomgang(Number(arg));
  else if (side === 'finn') visFinn(arg ? decodeURIComponent(arg) : null);
  else if (side === 'mer') visMer();
  else visOversikt();
}

// ---------- oppstart ----------
async function start() {
  oppdaterSynkstatus();
  window.addEventListener('hashchange', rute);
  window.addEventListener('online', synk);
  window.addEventListener('offline', oppdaterSynkstatus);
  $('#synkstatus').addEventListener('click', synk);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

  try {
    tilstand.config = await (await fetch('/api/config')).json();
    skriv('bb.config', tilstand.config);
  } catch {
    tilstand.config = les('bb.config') || { googleClientId: null };
  }
  rute();
  await synk();
  if (!tilstand.data) rute();
  setInterval(() => { if (tilstand.ko.length) synk(); }, 60e3);
}

start();
