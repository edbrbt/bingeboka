-- Bingeboka – databaseskjema (Postgres)
-- Kan kjøres flere ganger; oppretter bare det som mangler.

CREATE TABLE IF NOT EXISTS garde (
  id        INTEGER PRIMARY KEY,          -- gardenummer 1–11
  del       TEXT    NOT NULL,             -- 'nord' eller 'sor'
  plasser   INTEGER NOT NULL,             -- antall plasser i melkegruppa
  binge     TEXT    NOT NULL,             -- fysisk binge; 9 og 10 deler binge '9-10'
  sortering INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS geit (
  id        TEXT PRIMARY KEY,             -- identifikator / øremerkenummer
  navn      TEXT,
  kategori  TEXT NOT NULL DEFAULT 'melkegeit',  -- melkegeit | påsett | bukk
  aktiv     BOOLEAN NOT NULL DEFAULT TRUE,
  merknad   TEXT,
  opprettet TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gjennomgang (
  id            SERIAL PRIMARY KEY,
  klient_id     TEXT UNIQUE,              -- for trygg synk fra telefon (unngår dobbeltlagring)
  garde_id      INTEGER NOT NULL REFERENCES garde(id),
  tidspunkt     TIMESTAMPTZ NOT NULL,
  registrert_av TEXT NOT NULL,
  antall        INTEGER NOT NULL,
  merknad       TEXT
);

CREATE TABLE IF NOT EXISTS plassering (
  id             SERIAL PRIMARY KEY,
  klient_id      TEXT UNIQUE,
  geit_id        TEXT NOT NULL REFERENCES geit(id),
  garde_id       INTEGER NOT NULL REFERENCES garde(id),
  tidspunkt      TIMESTAMPTZ NOT NULL,
  kilde          TEXT NOT NULL,           -- 'gjennomgang' | 'flytting'
  gjennomgang_id INTEGER REFERENCES gjennomgang(id),
  registrert_av  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS plassering_geit_tid ON plassering (geit_id, tidspunkt DESC);

-- Gjeldende plassering = siste registrering per geit
CREATE OR REPLACE VIEW naavaerende AS
SELECT DISTINCT ON (p.geit_id)
       p.geit_id, p.garde_id, p.tidspunkt, p.kilde
FROM plassering p
JOIN geit g ON g.id = p.geit_id AND g.aktiv
ORDER BY p.geit_id, p.tidspunkt DESC, p.id DESC;

INSERT INTO garde (id, del, plasser, binge, sortering) VALUES
  (1,  'nord', 24, '1',    1),
  (2,  'nord', 24, '2',    2),
  (3,  'nord', 24, '3',    3),
  (4,  'nord', 15, '4',    4),
  (5,  'nord', 24, '5',    5),
  (6,  'nord', 24, '6',    6),
  (7,  'sor',  24, '7',    7),
  (8,  'sor',  24, '8',    8),
  (9,  'sor',  24, '9-10', 9),
  (10, 'sor',  24, '9-10', 10),
  (11, 'sor',  24, '11',   11)
ON CONFLICT (id) DO NOTHING;
