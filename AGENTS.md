# AGENTS.md: SkyNav Sim

Read this whole file at the start of **every** session. It is kept short on purpose.

## Project
SkyNav Sim is an avionics flight simulator. It is **one Nuxt 4 app** (Vue 3 + Nitro server), with Prisma 6, PostgreSQL 17 and npm.
The simulation runs in the browser at 60 fps; the server only stores data (stations, scenarios, users, flights, scores).

| Doc | Use |
|---|---|
| `docs/agent/PROGRESS.md` | Task status + handoff notes. **Read first.** |
| `docs/agent/tasks/week-N.md` | Task cards. Read **only your card.** |
| `docs/agent/CONTRACTS.md` | Source of truth: types, formulas, test numbers, DB, API, seed. Read **only the sections your card lists.** |
| `docs/agent/TESTING.md` | Test setup and week checkpoints |

---

## Session protocol

### Start
1. `cat docs/agent/PROGRESS.md` and pick your task: the ID you were given, or the first `TODO` whose dependencies are all `DONE`.
2. Read only your card:
   `sed -n '/^### W1-T04/,/^### W/p' docs/agent/tasks/week-1.md`
3. Read only the contract sections the card lists:
   `sed -n '/^## §4 /,/^## §/p' docs/agent/CONTRACTS.md`
4. Read only the files under **Read** in the card. If you need anything else, `grep -n` first, then `sed -n 'a,bp'` the smallest range.
5. Set the task to `IN_PROGRESS` in PROGRESS.md.

### Work
- Follow the card's steps in order. Write the card's tests alongside the code.
- Run the card's **Verify** commands and fix until they are green.

### End
1. `npm run check` must pass. This runs lint, typecheck and unit tests (from W1-T01 on).
2. In PROGRESS.md, set the status to `DONE` and add a **handoff note of at most 5 lines**: files created, anything the next task must know, and any deviation from CONTRACTS.
3. `git add -A && git commit -m "<commit message from the card>"`
4. **Stop.** Do not start the next task in the same session.

---

## Context budget rules
- **One task per session.** If a task needs more than about 400 new lines, split it (`W2-T15a`, `W2-T15b`), record the split in PROGRESS.md, and do part a only.
- **Never read:** `node_modules/`, `.nuxt/`, `.output/`, `package-lock.json`, `prisma/migrations/`, `*.log`, or other weeks' task files.
- **Never `cat` a file over 150 lines.** Use `grep -n`, then `sed -n 'a,bp'`.
- Keep every source file **under 300 lines**, with one responsibility per file.
- **Trim output:** add `2>&1 | tail -n 40` to installs, builds and tests. Use `--reporter=dot` with Vitest.
- **Never run the dev server in the foreground.** Use `bash scripts/with-dev.sh <command>`.
- Don't read another module to learn its interface. Read its **contract** in CONTRACTS.md.
- If a contract must change, edit CONTRACTS.md in the same commit and say so in the handoff note.
- Don't paste code into PROGRESS.md. Reference file paths.

---

## Commands
| Command | What |
|---|---|
| `docker compose up -d db` | Start PostgreSQL (dev DB `skynav`, test DB `skynav_test`) |
| `npm run dev` | Dev server on :3000 (background only, via with-dev.sh) |
| `npm run check` | Lint + typecheck + unit tests |
| `npm run test:unit` | Vitest unit tests (`tests/unit`) |
| `npm run test:int` | DB integration tests (`tests/int`, uses `skynav_test`) |
| `bash scripts/with-dev.sh npm run smoke` | Start dev, wait for health, run the API smoke test, then stop |
| `npx prisma migrate dev --name <name>` | New migration |
| `npx prisma db seed` | Seed the dev DB |

---

## Code conventions
- TypeScript strict mode. No `any`; use `unknown` and narrow it.
- **Pure logic folders:** `app/sim`, `app/nav`, `app/systems`, `shared/utils`, and the `*.logic.ts` files in `server/services`.
  - Plain TS functions only: no Vue or Nuxt imports, no auto-imports. Import `shared/` code via the **`#shared/…` alias** (deep relative imports into `shared/` break the Nuxt production build); other imports are relative. Vitest resolves `#shared` too.
  - No `Date.now()` or `Math.random()` inside. Pass the time or an RNG in (`shared/utils/random.ts`).
- **Units go in names:** `altFt`, `iasKt`, `distNm`, `hdgDeg`, `vsFpm`, `tMs`, `lateralM`. Use degrees at module boundaries and radians only internally.
- **Local frame:** x is east and y is north, in NM. The origin is the runway 09 threshold. All bearings are **true**; magnetic variation is 0.
- **Vue:** `<script setup lang="ts">` with typed props. Instruments take props in and draw to a canvas. The parent wraps instruments in `<ClientOnly>`.
- **Server:** handlers stay thin: validate with Zod, call the service, return the result. Services take `prisma` as their first argument. Errors use `createError({ statusCode, statusMessage })`.
- **Names:** components are PascalCase `.vue`; composables are `useX.ts`; other files are camelCase `.ts`.

## Testing rules
- Every pure function gets the test vectors from its CONTRACTS section, with the tolerances given there.
- Never weaken a test to make it pass. Fix the code, or flag the problem in the handoff note.
- Pages: check that they return HTTP 200 via `with-dev.sh` + `curl`. The human does the visual checks at the week checkpoint (see TESTING.md).

## Do not
- Add dependencies the card doesn't list without noting them in the handoff.
- Change `prisma/schema.prisma` unless the card says so.
- Commit `.env` or secrets.
- Edit files outside the card's **Create/Modify** list, except PROGRESS.md and CONTRACTS.md.
