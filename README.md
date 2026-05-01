# QR Tickets Local MVP

Simple local system for event tickets:
- backend: Node.js + Express + SQLite (`better-sqlite3`)
- frontend: Vue 3 + TypeScript + Vue Router
- ticket rendering: HTML/CSS template + Puppeteer to PNG
- QR flow: generate on ticket creation, scan in browser camera

## Project Structure

```text
qr-tickets-local/
  backend/
    src/
      app.ts
      server.ts
      config/
      db/
      middlewares/
      modules/
        auth/
        tickets/
        checkin/
      services/
        qr/
        ticket-generator/
      templates/
      scripts/
    storage/tickets/
    assets/
    .env.example
  frontend/
    src/
      app/
      pages/
      components/
      api/
      router/
      types/
      composables/
    .env.example
```

## Requirements

- Node.js 20+ recommended
- npm 10+

## Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend runs on `http://localhost:4000`.

Notes:
- SQLite DB file: `backend/storage/app.db`
- Generated tickets: `backend/storage/tickets/*.png`
- Put your own background at `backend/assets/ticket-background.png` (optional but recommended)
- Browser for ticket rendering is not auto-downloaded on `npm install`; use system Chrome/Chromium or run `npm run setup:browser`.

### WSL/Linux Notes

If ticket generation cannot find a browser, install Chromium:

```bash
sudo apt update
sudo apt install -y chromium-browser || sudo apt install -y chromium
```

If needed, set explicit browser path in `backend/.env`:

```bash
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `https://localhost:5173`.

If HTTPS certs are not generated yet:

```bash
cd backend
npm run setup:https
```

For iOS camera access:
- open the frontend only via `https://` URL
- trust the self-signed certificate in Safari when prompted
- frontend calls backend through Vite proxy (`/api -> http://127.0.0.1:4000`)

## Seed Data

```bash
cd backend
npm run seed
```

Seed creates 3 demo tickets if the table is empty.

Generate random test tickets:

```bash
cd backend
npm run seed:random -- --count 50
```

Drop DB and tickets first, then generate a fresh batch:

```bash
cd backend
npm run seed:random -- --count 50 --drop
```

`--drop` resets the tickets table and removes generated PNG files.

If Chrome is not installed for Puppeteer yet, run:

```bash
cd backend
npm run setup:browser
```

## API Endpoints

### Auth
- `POST /api/auth/pin`

### Tickets
- `GET /api/tickets?search=&status=all|used|unused`
- `GET /api/tickets/:id`
- `POST /api/tickets`
- `PATCH /api/tickets/:id`
- `DELETE /api/tickets/:id`
- `POST /api/tickets/:id/regenerate`
- `GET /api/tickets/:id/file`

### Check-in
- `POST /api/checkin`

All protected endpoints use header:
- `x-pin: <pin>`

## Default PINs

From backend `.env` (`ADMIN_PINS`), defaults to:
- `1234`
- `5678`

## Check-in Behavior

`POST /api/checkin`:
- `not_found`: QR is unknown
- `already_used`: ticket was previously scanned
- `success`: ticket marked as used atomically (within DB transaction)

## NPM Scripts

Backend:
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run seed`
- `npm run seed:random -- --count 50 [--drop]`
- `npm run setup:browser`

Frontend:
- `npm run dev`
- `npm run build`
- `npm run preview`
