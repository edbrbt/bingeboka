# Bingeboka

Mobilapp for Russelv gård som holder oversikt over **hvilket garde hver geit står i**.
Den erstatter papirlappen som brukes når et garde står i melkestallen.

Krav, epics, user stories og NFR: se [docs/krav.md](docs/krav.md) og [Issues](https://github.com/edbrbt/bingeboka/issues).

## Hva den gjør (versjon 0.1)

- **Oversikt over gardene** i nordre del (garde 1–6) og søndre del (garde 7–11), med belegg, ledige plasser og når hvert garde sist ble gjennomgått. Garde 9 og 10 deler én binge, men regnes som to melkegrupper på 24.
- **Gjennomgang ved melkestallen:** velg et garde, og lista fra forrige gjennomgang fylles inn. Skriv inn ID-er eller kryss av. Appen varsler om ukjente geiter, geiter som sist sto i et annet garde, og om det er flere geiter enn plasser.
- **Oppsummering før lagring:** hvem som er til stede, hvem som har flyttet inn, nye geiter og hvem som ikke ble sett.
- **Finn geit:** søk på ID eller navn, se hvilket garde geita står i og historikken. Du kan registrere en flytting, legge inn navn og kategori, eller ta geita ut av besetningen.
- **Virker uten nett:** registreringer lagres på telefonen og sendes automatisk når det er dekning. Et påbegynt garde går ikke tapt om telefonen låses.
- **Eksport til regneark:** last ned gjeldende plasseringer som CSV under «Mer».
- **Google-innlogging:** bare e-postadresser som står på tillatt-lista, slipper inn.
- Appen kan legges på hjemskjermen som en vanlig app (PWA).

## Teknisk oppsett

- Statisk frontend i `public/`, uten byggesteg.
- Serverfunksjoner i `api/` som kjører på Vercel.
- Postgres-database. Neon via Vercel Marketplace anbefales, og gratisnivået holder godt.
- Datamodellen ligger i `db/schema.sql`: `garde`, `geit`, `gjennomgang`, `plassering`. Gjeldende plassering er alltid den siste registreringen per geit, så historikken følger med automatisk.

## Kjøre lokalt

```bash
npm install
npm run dev        # http://localhost:3000
```

Lokalt brukes en innebygd database som lagres i `.lokaldata/`, og innlogging er slått av.

## Sette i drift på Vercel

1. **Importer repoet** i Vercel med «Add New → Project». Velg rammeverket «Other». Det trengs ingen byggekommando.
2. **Database:** gå til Storage → Create Database → Neon (Postgres) og koble den til prosjektet. Da settes `DATABASE_URL` automatisk.
3. **Opprett tabellene** én gang fra din egen maskin:
   ```bash
   DATABASE_URL="postgres://..." npm run db:opprett
   ```
4. **Google-innlogging:** gå til Google Cloud Console → APIs & Services → Credentials → «Create OAuth client ID» av typen *Web application*.
   Under *Authorized JavaScript origins* legger du inn Vercel-adressen, for eksempel `https://bingeboka.vercel.app`, og eventuelt `http://localhost:3000`.
   Du kan gjenbruke Google Cloud-prosjektet fra timeregistreringsappen.
5. **Miljøvariabler i Vercel** (Settings → Environment Variables):

   | Variabel | Eksempel |
   |---|---|
   | `GOOGLE_CLIENT_ID` | `1234-abc.apps.googleusercontent.com` |
   | `TILLATTE_EPOSTER` | `edbrbt@gmail.com,annen@gmail.com` |
   | `DATABASE_URL` | settes automatisk av Neon |

6. Deploy på nytt.

## Hente inn dagens plasseringer fra regnearket

Last ned arket som CSV (Fil → Last ned → CSV). Det må ha kolonnene `Geit` og `Garde`. Kolonnene `Navn`, `Kategori` og `Dato` er valgfrie. Kjør så:

```bash
DATABASE_URL="postgres://..." npm run importer -- plasseringer.csv
```

## Mulige neste steg

- Skjermbilde som ligner melkestallen, med 24 plasser i samme rekkefølge som i stallen.
- Skanning av øremerker (RFID-leser via Bluetooth, eller kamera).
- Import av besetningslisten fra Geitekontrollen.
- Påminnelse om garder som ikke er gjennomgått på lenge.
- Felles innlogging og brukere med timeregistreringsappen.
