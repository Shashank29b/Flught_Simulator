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
```
That's all. On the first start the app creates the database tables and loads the world airport data (included in the repo) by itself. The first build takes 5–10 minutes; give it about 30 seconds more for the first seed.

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
```
The app seeds itself again on start.

---

## Full cycle at a glance
| Step | Command |
|---|---|
| Install (first time) | `git clone …`, then `cd Flught_Simulator`, then `docker compose up -d --build` |
| Start | `docker compose up -d` |
| Use | open http://localhost:3000/cockpit |
| Stop | `docker compose down` |
| Update | `docker compose down`, then `git pull`, then `docker compose up -d --build` |
| Reset everything | `docker compose down -v`, then `docker compose up -d --build` |

## Help
| Problem | Fix |
|---|---|
| `Cannot connect to the Docker daemon` | Open Docker Desktop and wait until it is running |
| `port 3000 is already allocated` | Close any other server on port 3000 (for example `npm run dev`) |
| `port 5432 is already allocated` | Stop the PostgreSQL that is installed on your computer (Windows: Services → postgresql → Stop) |
| Map has few or no airports | Wait about 30 s after the first start (seeding), then reload. Still empty: `docker compose logs app --tail 50` |
| Page shows an error | Run `docker compose logs app --tail 50` and send the output |
| Is it running? | `docker compose ps`: `db` and `app` should be *Up* |
