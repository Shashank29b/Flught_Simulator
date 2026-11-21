# Setup guide: SkyNav Sim

This guide takes a fresh machine to a running simulator in about 10 minutes.

## 1. Requirements
| Tool | Version | Check |
|---|---|---|
| Node.js | 22 LTS | `node -v` |
| npm | 10+ | `npm -v` |
| Docker + Docker Compose | any recent | `docker --version` and `docker compose version` |
| Git | any | `git --version` |
| Google Chrome (optional) | any | only for the browser test (`npm run test:e2e`) |

> **Linux:** if `docker` says *permission denied*, either prefix the Docker commands with `sudo`, or add yourself to the docker group once:
> `sudo usermod -aG docker $USER`, then log out and back in.

## 2. Get the code
```bash
git clone git@github.com:Shashank29b/Flught_Simulator.git
cd Flught_Simulator
npm install
```

## 3. Environment file
The repository includes a ready-to-use `.env` for local development, so nothing is needed for a local run.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | main database (`skynav`) |
| `TEST_DATABASE_URL` | database used by the integration tests (`skynav_test`) |
| `NUXT_APP_SECRET` | encrypts the login session cookie |

> **Deploying publicly?** The committed `NUXT_APP_SECRET` is public, so generate your own for any real server:
> `sed -i "s|^NUXT_APP_SECRET=.*|NUXT_APP_SECRET=$(openssl rand -base64 32 | tr -d '/+=')|" .env`
> Also change the database password, both in `docker-compose.yml` and in `DATABASE_URL`.

## 4. Start PostgreSQL
```bash
docker compose up -d db
```
This starts PostgreSQL 17 on port 5432 and also creates the `skynav_test` database. Data is kept in the `pgdata` Docker volume.

## 5. Create the tables
```bash
npx prisma migrate deploy
```

## 6. Download the world airport data (recommended)
```bash
bash scripts/data/download.sh
```
This downloads the free OurAirports dataset (airports, runways, nav aids, about 18 MB) into `data/ourairports/`. The folder is not committed to git.

## 7. Seed the database
```bash
npx prisma db seed
```
- **With** the downloaded data: about 48,000 airports, 28,700 runway ends and 13,800 nav aids worldwide, plus the training ILS at Bengaluru. Takes about 10 s.
- **Without** it: Bengaluru (VOBL) and nearby nav aids only.

The seed is safe to rerun: it wipes and recreates everything, including users and saved flights.

## 8. Run
```bash
npm run dev
```
Open **http://localhost:3000**.

| Page | What |
|---|---|
| `/cockpit` | Main simulator: all instruments, radios, controls, map, Journey autopilot. No login needed. |
| `/scenarios` | Test mode: graded exercises (login required). |
| `/flights` | Your flight log. |

Demo accounts:
| Email | Password | Role |
|---|---|---|
| `student@skynav.local` | `student1234` | Student |
| `admin@skynav.local` | `admin1234` | Admin |

## 9. Controls
| Key | Action |
|---|---|
| W / S | stick forward / back (nose down / up) |
| A / D | roll left / right |
| Q / E | yaw (rudder); also steers on the runway |
| ↑ / ↓ or + / − | throttle |
| G · F · P · R | gear · flaps · pause · reset |

On screen you also get:
- the same stick and rudder buttons
- a throttle slider
- **±10 kt aircraft speed** (in a journey this changes the cruise speed)
- **± simulation speed** (1×–64×)
- flaps and gear
- start positions

**Triple-tap any instrument** to see what it is and how it works.

**Journey:** in the Cockpit, choose *From* and *To* airports and press **Start journey**. The aircraft takes off, flies and lands by itself. Any W/S/A/D/Q/E key gives you control; **Engage autopilot** hands it back.

## 10. Tests
Start the database first: `docker compose up -d db`.
```bash
npm run check        # typecheck + lint + 93 unit tests
npm run test:int     # database integration tests (uses skynav_test)
bash scripts/with-dev.sh npm run smoke     # API smoke test (starts and stops a dev server)
```
The browser test needs a running server (`npm run dev` in another terminal) and Google Chrome:
```bash
npm run test:e2e
```

## 11. Production build
```bash
npm run build
node .output/server/index.mjs     # serves on port 3000; needs DATABASE_URL and NUXT_APP_SECRET set
```

## 12. Troubleshooting
| Problem | Fix |
|---|---|
| `permission denied … docker.sock` | use `sudo docker …`, or join the docker group (see §1) |
| `Can't reach database server` | `docker compose up -d db`, then wait a few seconds |
| Map shows few airports | the count is for the visible area; zoom out, or tick **Whole world** (India only by default) |
| Test mode says "scenario does not exist" or login fails | rerun `npx prisma db seed`, then log in again |
| `port 3000 already in use` | stop the other `npm run dev`, or run with `PORT=3001 npm run dev` |
| Nothing moves on the runway | add throttle (↑ or the slider); rotate with S at the rotate speed (jet 145 kt, trainer 65 kt) |
