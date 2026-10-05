# Karma bot za WhatsApp

Bot je poseban član grupe Drugarići. Odgovara samo na poruke koje počinju sa `!`.
Sve ostale poruke ignoriše: ne čuva ih, ne šalje ih nikome i ne koristi AI.

## Komande

| Komanda | Šta radi |
|---|---|
| `!karma Marko castio` | Marku +3 za častio |
| `!karma Tara Đina +3 došle na kafu` | Tari i Đini po +3 sa razlogom |
| `!karma Mikan ispalio Gradac` | Milošu −3 |
| `!tabela` | Tabela za 2026. |
| `!ko casti` | Nasumično bira ko časti (među prijavljenima, ako je druženje otvoreno) |
| `!druzenje Gradac subota 12h` | Otvara prijave za druženje |
| `!dolazim` / `!ne mogu` | Prijava; može i za druge: `!dolazim Marko Tara` |
| `!ko dolazi` | Spisak prijavljenih |
| `!bilo` | Zatvara druženje: organizator +5, svi prijavljeni +3 |
| `!otkazi` | Zatvara druženje bez poena |
| `!ja Marko` | Bot zapamti koji si član (treba samo ako te ne prepozna po imenu) |
| `!ponisti` | Briše poslednji unos koji je upisao bot |
| `!akcije` | Spisak akcija i poena |
| `!pomoc` | Uputstvo |
| `!grupa` | Ispisuje ID grupe (treba samo jednom, za podešavanje) |

Imena prepoznaje i po nadimcima (Mare, Mikan, Stef, Đina, Aleks, Mačak…), sa ili bez kvačica.
Akcije su iste kao na sajtu (organizovao +5, poklon +5, castio +3, dosao +3, kafa +2, pomogao +2,
cestitao +1, kasnio −1, ghost −2, ispalio −3…), a može i bilo koji broj od −20 do +20.

Svaki unos se upisuje u `data.json` u ovom repou, pa se odmah vidi i na GitHub sajtu.

## Šta ti treba

1. **Nalog za bota**: najbezbednije je druga SIM ili eSIM kartica sa WhatsApp-om.
   Može i tvoj lični broj (bot se poveže kao povezani uređaj), ali tada odgovori stižu
   od tebe (sa oznakom 🤖), a eventualna blokada od strane WhatsApp-a pogađa tvoj nalog.
2. **Računar koji je stalno upaljen** sa Node.js 20 ili novijim: mali VPS ili Raspberry Pi.
3. **GitHub token** samo za ovaj repo:
   GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens →
   Generate new token. Repository access: samo `najbolji-drugaric`.
   Permissions: Contents = Read and write. Ništa drugo.

## Pokretanje

```bash
git clone https://github.com/StefanSeat/najbolji-drugaric.git
cd najbolji-drugaric/bot
npm install
cp .env.example .env      # upiši GITHUB_TOKEN
npm start
```

1. U terminalu se pojavi QR kod. Na telefonu bota otvori WhatsApp → Povezani uređaji →
   Poveži uređaj i skeniraj ga.
2. Dodaj broj bota u grupu Drugarići.
3. U grupi napiši `!grupa`. Bot odgovori sa `GROUP_ID=...@g.us`.
4. Upiši tu vrednost u `.env` kao `GROUP_ID` i restartuj bota. Od tada radi samo u toj grupi.

Prijava se čuva u folderu `auth/`, pa QR treba skenirati samo prvi put.
Otvoreno druženje i ko je koji broj čuvaju se u `state.json` pored bota.

### Da radi stalno (i posle restarta računara)

```bash
npm install -g pm2
pm2 start bot.js --name karma-bot
pm2 save
pm2 startup     # pa pokreni komandu koju ispiše
```

## Proba bez WhatsApp-a i GitHub-a

```bash
npm test
```

## Važno

- Ovo nije zvanični WhatsApp API. WhatsApp može da blokira broj bota. Tvoj lični broj nije u
  opasnosti.
- Unosi bota imaju `id` koji počinje sa `bot-`. Automatska sinhronizacija sa claude.ai bazom ih
  čuva, ali se oni ne vide na claude.ai verziji sajta, samo na GitHub sajtu.
- Ako se bot odjavi (npr. obrišeš povezani uređaj), obriši folder `auth/` i pokreni ga ponovo.
