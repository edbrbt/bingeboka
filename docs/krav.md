# Krav – Bingeboka for Russelv gård

Sist oppdatert: 6. november 2026

Dette dokumentet beskriver formål, roller, epics, user stories og ikke-funksjonelle krav (NFR) for appen.
Arbeidet følges opp i [GitHub Issues](https://github.com/edbrbt/bingeboka/issues). Hver epic er en issue med etiketten `epic`, og user stories ligger under som sub-issues. De ikke-funksjonelle kravene har etiketten `NFR` og ligger samlet under [#43](https://github.com/edbrbt/bingeboka/issues/43).
Dette dokumentet er oversikten. Issuene viser status til enhver tid.

## Formål

På Russelv gård (RG) er det nyttig å vite hvilket garde hver geit står i. I dag gjøres det ved jevnlige gjennomganger når et garde står i melkestallen. Numrene skrives på papir og overføres senere til et Google-ark. Bingeboka skal:

1. gjøre det raskt å registrere hvilke geiter som står i et garde, rett fra mobilen ved melkestallen
2. vise hvor hver geit står nå, og hvor den har stått før
3. fange opp avvik med en gang: ukjente geiter, geiter som er flyttet, og garder med flere geiter enn plasser
4. virke i fjøset, også uten nettdekning og med skitne øremerker

## Roller

| Rolle | Beskrivelse |
| --- | --- |
| Bruker | Eier, avløser eller annen som melker. Gjennomgår garder, finner og flytter geiter. |
| Administrator | Daglig leder. Som bruker, og i tillegg tilgang, oppsett av garder og import (fra versjon 2). |

## Fjøsoppsett

Driftsbygningen har to deler som er skilt med en dør, med til sammen 11 garder.

| Del | Garde | Plasser |
| --- | --- | --- |
| Nord | 1, 2, 3, 5, 6 | 24 hver |
| Nord | 4 | 15 |
| Sør | 7, 8, 11 | 24 hver |
| Sør | 9 og 10 | 24 hver, i én felles binge med 48 plasser |

Garde 9 og 10 står i samme binge, men regnes som to garder fordi melkestallen har plass til 24 geiter om gangen. Til sammen er det 255 plasser.

## Øremerker

Geitene har øremerker i rød, gul, rosa eller blå. Merket har «NO» og besetningsnummeret (8 siffer, likt for alle geitene i besetningen) med liten skrift, og geitas nummer med stor skrift. **Det store nummeret er identifikatoren i appen.** Merkene er ofte skitne og vanskelige å lese, både for øyet og for kamera (se E4).

## Statuskoder

✅ ferdig · ◐ delvis · ⬜ ikke startet. **MVP** = del av første versjon.

## Epics og user stories


### E1 – Tilgang og brukere ([#1](https://github.com/edbrbt/bingeboka/issues/1))

| ID | User story | MVP | Status |
| --- | --- | --- | --- |
| [E1.1](https://github.com/edbrbt/bingeboka/issues/2) | Som bruker vil jeg logge inn med Google-kontoen min, slik at jeg slipper et eget passord. | MVP | ✅ |
| [E1.2](https://github.com/edbrbt/bingeboka/issues/3) | Som administrator vil jeg at bare de jeg har godkjent kommer inn, slik at ingen utenforstående ser eller endrer besetningen. | MVP | ◐ |
| [E1.3](https://github.com/edbrbt/bingeboka/issues/4) | Som administrator vil jeg legge til og fjerne brukere i appen, slik at jeg slipper å endre innstillinger i Vercel. |  | ⬜ |
| [E1.4](https://github.com/edbrbt/bingeboka/issues/5) | Som bruker vil jeg velge språk (norsk eller ukrainsk), slik at jeg forstår alle tekstene i appen. |  | ⬜ |
| [E1.5](https://github.com/edbrbt/bingeboka/issues/6) | Som administrator vil jeg vedlikeholde brukerne ett sted for gårdens apper, slik at en ny avløser får tilgang til både Timeregistrering og Bingeboka på én gang. |  | ⬜ |

### E2 – Garder og fjøsoppsett ([#7](https://github.com/edbrbt/bingeboka/issues/7))

| ID | User story | MVP | Status |
| --- | --- | --- | --- |
| [E2.1](https://github.com/edbrbt/bingeboka/issues/8) | Som bruker vil jeg se alle garder i nordre del (1–6) og søndre del (7–11) med antall geiter og plasser, slik at jeg ser hvor det er fullt og hvor det er ledig. | MVP | ✅ |
| [E2.2](https://github.com/edbrbt/bingeboka/issues/9) | Som bruker vil jeg se garde 9 og 10 både hver for seg og samlet, slik at jeg vet hvor mange som står i den felles bingen (48 plasser). | MVP | ✅ |
| [E2.3](https://github.com/edbrbt/bingeboka/issues/10) | Som bruker vil jeg se når hvert garde sist ble gjennomgått, slik at jeg vet hvilke garder som bør tas neste gang. | MVP | ✅ |
| [E2.4](https://github.com/edbrbt/bingeboka/issues/11) | Som administrator vil jeg endre antall plasser og oppsettet av garder, slik at appen stemmer når fjøset bygges om eller gardene deles annerledes. |  | ⬜ |

### E3 – Gjennomgang ved melkestallen ([#12](https://github.com/edbrbt/bingeboka/issues/12))

| ID | User story | MVP | Status |
| --- | --- | --- | --- |
| [E3.1](https://github.com/edbrbt/bingeboka/issues/13) | Som bruker vil jeg velge et garde og få listen fra forrige gjennomgang ferdig utfylt, slik at jeg bare trenger å krysse av. | MVP | ✅ |
| [E3.2](https://github.com/edbrbt/bingeboka/issues/14) | Som bruker vil jeg skrive inn nummeret på øremerket og få forslag mens jeg skriver, slik at det går raskt og blir riktig. | MVP | ✅ |
| [E3.3](https://github.com/edbrbt/bingeboka/issues/15) | Som bruker vil jeg få beskjed med en gang når noe ikke stemmer, slik at jeg kan sjekke geita mens den står foran meg. | MVP | ✅ |
| [E3.4](https://github.com/edbrbt/bingeboka/issues/16) | Som bruker vil jeg se en oppsummering før jeg lagrer, slik at jeg oppdager feil før de havner i oversikten. | MVP | ✅ |
| [E3.5](https://github.com/edbrbt/bingeboka/issues/17) | Som bruker vil jeg at en påbegynt gjennomgang blir husket, slik at ingenting går tapt om telefonen låses eller appen lukkes. | MVP | ✅ |
| [E3.6](https://github.com/edbrbt/bingeboka/issues/18) | Som bruker vil jeg se melkestallen som 24 plasser i samme rekkefølge som i stallen, slik at jeg kan gå systematisk langs rekka. |  | ⬜ |
| [E3.7](https://github.com/edbrbt/bingeboka/issues/19) | Som bruker vil jeg kunne rette en gjennomgang jeg har lagret feil, slik at oversikten blir riktig uten å gå gjennom gardet på nytt. |  | ⬜ |

### E4 – Lese øremerker ([#20](https://github.com/edbrbt/bingeboka/issues/20))

| ID | User story | MVP | Status |
| --- | --- | --- | --- |
| [E4.1](https://github.com/edbrbt/bingeboka/issues/21) | Som bruker vil jeg kunne skanne øremerket med kameraet (Livetekst i iOS), slik at jeg slipper å taste nummeret. | MVP | ⬜ |
| [E4.2](https://github.com/edbrbt/bingeboka/issues/22) | Som bruker vil jeg få forslag når nummeret bare er delvis lesbart, slik at et skittent merke ikke stopper registreringen. | MVP | ⬜ |
| [E4.3](https://github.com/edbrbt/bingeboka/issues/23) | Som bruker vil jeg kunne ta bilde av et skittent øremerke og få nummeret lest av en bildemodell, slik at også vanskelige merker kan leses uten å vaske dem. |  | ⬜ |
| [E4.4](https://github.com/edbrbt/bingeboka/issues/24) | Som bruker vil jeg kunne lese elektroniske øremerker med en RFID-stavleser, slik at registreringen går raskt og uten feil. |  | ⬜ |

### E5 – Geiter og besetning ([#25](https://github.com/edbrbt/bingeboka/issues/25))

| ID | User story | MVP | Status |
| --- | --- | --- | --- |
| [E5.1](https://github.com/edbrbt/bingeboka/issues/26) | Som bruker vil jeg søke på nummer eller navn og se hvilket garde geita står i, slik at jeg finner den raskt. | MVP | ✅ |
| [E5.2](https://github.com/edbrbt/bingeboka/issues/27) | Som bruker vil jeg registrere at en geit er flyttet, slik at plasseringen stemmer også mellom gjennomgangene. | MVP | ✅ |
| [E5.3](https://github.com/edbrbt/bingeboka/issues/28) | Som bruker vil jeg se hvor en geit har stått tidligere, slik at jeg kan følge flyttinger over tid. | MVP | ✅ |
| [E5.4](https://github.com/edbrbt/bingeboka/issues/29) | Som bruker vil jeg gi geita navn og kategori (melkegeit, påsett eller bukk), slik at oversikten blir mer nyttig. | MVP | ✅ |
| [E5.5](https://github.com/edbrbt/bingeboka/issues/30) | Som bruker vil jeg ta en geit ut av besetningen når den er solgt eller død, slik at den ikke lenger vises i gardene. | MVP | ✅ |
| [E5.6](https://github.com/edbrbt/bingeboka/issues/31) | Som bruker vil jeg registrere fargen på øremerket (rød, gul, rosa, blå), slik at fargen kan brukes som ekstra hjelp når nummeret er vanskelig å lese. |  | ⬜ |
| [E5.7](https://github.com/edbrbt/bingeboka/issues/32) | Som administrator vil jeg hente besetningslisten fra Geitekontrollen, slik at nye og utgåtte geiter er oppdatert uten å legge dem inn for hånd. |  | ⬜ |

### E6 – Bruk uten nett og synkronisering ([#33](https://github.com/edbrbt/bingeboka/issues/33))

| ID | User story | MVP | Status |
| --- | --- | --- | --- |
| [E6.1](https://github.com/edbrbt/bingeboka/issues/34) | Som bruker vil jeg kunne registrere selv om det ikke er dekning i fjøset, slik at jobben ikke stopper. | MVP | ✅ |
| [E6.2](https://github.com/edbrbt/bingeboka/issues/35) | Som bruker vil jeg se om alt er lagret eller om noe venter på nett, slik at jeg vet om jeg må gjøre noe. | MVP | ✅ |
| [E6.3](https://github.com/edbrbt/bingeboka/issues/36) | Som bruker vil jeg legge appen på hjemskjermen, slik at den åpnes som en vanlig app også uten nett. | MVP | ✅ |
| [E6.4](https://github.com/edbrbt/bingeboka/issues/37) | Som bruker vil jeg få beskjed hvis noen andre har gjennomgått samme garde mens jeg var uten nett, slik at registreringene ikke overskriver hverandre uten at vi vet det. |  | ⬜ |

### E7 – Import og eksport ([#38](https://github.com/edbrbt/bingeboka/issues/38))

| ID | User story | MVP | Status |
| --- | --- | --- | --- |
| [E7.1](https://github.com/edbrbt/bingeboka/issues/39) | Som bruker vil jeg laste ned gjeldende plasseringer som CSV, slik at jeg kan bruke dem i Google-arket. | MVP | ✅ |
| [E7.2](https://github.com/edbrbt/bingeboka/issues/40) | Som administrator vil jeg hente inn plasseringene fra dagens Google-ark, slik at vi ikke starter med en tom bok. | MVP | ◐ |
| [E7.3](https://github.com/edbrbt/bingeboka/issues/41) | Som administrator vil jeg eksportere alle gjennomganger og flyttinger for en periode, slik at jeg kan analysere eller arkivere dem. |  | ⬜ |
| [E7.4](https://github.com/edbrbt/bingeboka/issues/42) | Som administrator vil jeg at Google-arket oppdateres automatisk, slik at de som bruker arket alltid ser gjeldende plasseringer. |  | ⬜ |

## Ikke-funksjonelle krav (NFR)

| ID | Område | Krav |
| --- | --- | --- |
| [NFR-01](https://github.com/edbrbt/bingeboka/issues/44) | Brukervennlighet | Laget først for mobil. Store knapper og felt som er lette å treffe med arbeidshansker. Én geit skal kunne registreres på under 5 sekunder, og en gjennomgang av et fullt garde (24 geiter) på under 3 minutter. |
| [NFR-02](https://github.com/edbrbt/bingeboka/issues/45) | Dårlig dekning | Appen virker uten nett i fjøset (PWA). Alt som registreres, lagres på telefonen og sendes når nettet er tilbake. Synk kan gjentas uten dobbeltlagring. |
| [NFR-03](https://github.com/edbrbt/bingeboka/issues/46) | Sikkerhet | Google-innlogging (OAuth/OIDC). Tilgang sjekkes på serveren for hvert kall. Kun HTTPS. Hemmeligheter ligger i miljøvariabler, aldri i GitHub. |
| [NFR-04](https://github.com/edbrbt/bingeboka/issues/47) | Personvern (GDPR) | Appen behandler få personopplysninger: brukernes e-post og hvem som har gjort hver registrering. Bare nødvendige opplysninger lagres. Databehandleravtale med Vercel og Neon, med data lagret i EU/EØS. |
| [NFR-05](https://github.com/edbrbt/bingeboka/issues/48) | Integritet og sporbarhet | Plasseringer endres eller slettes aldri; nye registreringer legges til, og gjeldende plassering er den siste. Hver registrering har hvem, når og kilde (gjennomgang eller flytting). Rettinger logges. |
| [NFR-06](https://github.com/edbrbt/bingeboka/issues/49) | Tid og dato | Alt vises i tidssonen Europe/Oslo og i norsk datoformat. Tidspunktet settes på telefonen da registreringen ble gjort, ikke da den ble synket. |
| [NFR-07](https://github.com/edbrbt/bingeboka/issues/50) | Tilgjengelighet og backup | Appen er ikke kritisk for driften, men data skal ikke gå tapt. Neons gjenoppretting til et tidspunkt, pluss nattlig kryptert sikkerhetskopi utenfor Neon som i Timeregistrering (NFR-14 der). Gjenoppretting øves minst én gang i året. |
| [NFR-08](https://github.com/edbrbt/bingeboka/issues/51) | Universell utforming | Følg WCAG 2.1 AA så langt det er praktisk. God kontrast og stor tekst som kan leses i dårlig lys i fjøset. Status vises med tekst og symbol, ikke bare farge. |
| [NFR-09](https://github.com/edbrbt/bingeboka/issues/52) | Vedlikehold og kostnad | Én person skal kunne drifte appen. Ferdige skytjenester på gratisnivå (Vercel, Neon), ingen byggesteg. Automatiske tester for kontrollreglene (ukjent geit, flyttet geit, over kapasitet) og for tolkning av øremerker. |
| [NFR-10](https://github.com/edbrbt/bingeboka/issues/53) | Ytelse | Appen åpnes på under 2 sekunder over mobilnett. Forslag mens man skriver kommer på under 0,1 sekund med hele besetningen (rundt 400 dyr) lagret på telefonen. |
| [NFR-11](https://github.com/edbrbt/bingeboka/issues/54) | Lagring på telefonen | Appen skal brukes fra hjemskjermen på iPhone, der lagrede data ikke slettes automatisk slik Safari kan gjøre for nettsteder som ikke er brukt på en stund. Registreringer som venter i køen, skal sendes så snart det er nett, og appen varsler hvis noe har ventet i over et døgn. |
| [NFR-12](https://github.com/edbrbt/bingeboka/issues/55) | Kamera og bilder | Kameraet brukes bare når brukeren selv starter skanning. Bilder av øremerker lagres ikke, verken på telefonen eller på serveren. Ved AI-lesning (E4.3) sendes bare et beskåret bilde av merket, og leverandøren skal ikke bruke bildene til trening. |
| [NFR-13](https://github.com/edbrbt/bingeboka/issues/56) | Språk | Alle tekster i grensesnittet ligger i egne språkfiler, ikke rett i koden, slik at ukrainsk kan legges til (E1.4). |

## Åpne avklaringer

- **Farge på øremerket:** Betyr fargen noe, for eksempel fødselsår? Styrer E5.6 og hvor mye fargen kan hjelpe i E4.2.
- **Elektroniske øremerker:** Har geitene elektroniske merker som kan leses med RFID-leser? Styrer E4.4.
- **Geitekontrollen:** Hvilke eksportmuligheter finnes for besetningslisten? Styrer E5.7.
- **Google-arket:** Skal arket fortsatt brukes når appen er i bruk, eller kan det fases ut? Styrer E7.4.
- **Felles brukere:** Skal Bingeboka og Timeregistrering dele brukerliste og database? Styrer E1.3 og E1.5.
- **Geiter som ikke ble sett:** Skal en geit som ikke er sett i flere gjennomganger på rad, markeres som «ukjent plassering»? I dag står den registrert i gardet til den blir sett et annet sted.
