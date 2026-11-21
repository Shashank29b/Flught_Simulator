# Run SkyNav Sim with Docker (simple guide)

Works on Windows, macOS and Linux. You only need **Git** and **Docker Desktop**. No Node.js is required.

> Run every command **inside the project folder**: PowerShell on Windows, Terminal on macOS/Linux.
> Before you start, open **Docker Desktop** and wait until it says *running*.

---

## 1. First time (once)
```bash
git clone https://github.com/Shashank29b/Flught_Simulator.git
cd Flught_Simulator
docker compose up -d --build
docker compose run --rm app node scripts/data/download.mjs
docker compose run --rm app npx prisma db seed
```
1. **`git clone …` and `cd …`** download the code and go into its folder.
2. **`docker compose up -d --build`** builds and starts the app and the database. The first build takes 5–10 minutes.
3. **`docker compose run --rm app node scripts/data/download.mjs`** downloads the world airport data.
4. **`docker compose run --rm app npx prisma db seed`** fills the database. It should print "World data: 48082 airports…"

Open **http://localhost:3000/cockpit**

| Login (Test mode) | Password |
|---|---|
| `student@skynav.local` | `student1234` |
| `admin@skynav.local` | `admin1234` |

---

## 2. Start
```bash
docker compose up -d
```
Then open http://localhost:3000/cockpit

## 3. Stop
```bash
docker compose down
```
Your data (users, flights) is kept for next time.

---

## 4. Update to the latest version
```bash
docker compose down
git pull
docker compose up -d --build
```

## 5. Fresh start (deletes all data)
```bash
docker compose down -v
docker compose up -d --build
docker compose run --rm app node scripts/data/download.mjs
docker compose run --rm app npx prisma db seed
```

---

## Full cycle at a glance
| Step | Command |
|---|---|
| Install (first time) | section 1 |
| Start | `docker compose up -d` |
| Use | open http://localhost:3000/cockpit |
| Stop | `docker compose down` |
| Update | `docker compose down`, then `git pull`, then `docker compose up -d --build` |
| Reset everything | section 5 |

## Help
| Problem | Fix |
|---|---|
| `Cannot connect to the Docker daemon` | Open Docker Desktop and wait until it is running |
| `port 3000 is already allocated` | Close any other server on port 3000 (for example `npm run dev`) |
| `port 5432 is already allocated` | Stop the PostgreSQL that is installed on your computer (Windows: Services → postgresql → Stop) |
| Map has few or no airports | Rerun the download and seed commands from section 1 |
| Page shows an error | Run `docker compose logs app --tail 50` and send the output |
| Is it running? | `docker compose ps`: `db` and `app` should be *Up* |
