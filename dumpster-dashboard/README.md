# Dumpster Dashboard (CSC 131)

Campus waste-collection dashboard for Sacramento State. Drivers log bin pickups from their
phones, and admins see fullness, contamination and overflow across campus.

Built with Next.js 15 (React 19, TypeScript) and Prisma, using a PostgreSQL database.
It is hosted on **Vercel** with a **Neon** database.

## Pages

| Page | Who | What |
|---|---|---|
| `/` | Admin | Campus overview: filters, scorecards with sparklines, status/trend/building charts, top problem buildings, needs-attention list. Cards can be dragged and resized (saved per browser). |
| `/records/new` | Anyone | Pickup form drivers fill out (no login needed). Has a **Scan Bin QR Code** button. |
| `/records` | Admin | Every pickup, with filters, CSV import and CSV export. |
| `/bins` | Admin | Register bins and print their QR codes. |
| `/login` | — | Admin login. |

Fullness status: GREEN 0–49%, YELLOW 50–79%, RED 80–100%. Times are shown in campus time (Pacific).

## Run it on your computer

### 1. Install the requirements

- **Node.js 22** (20 or newer works; on Node 18 the CSV upload fails). Check with `node -v`.
  Get it from [nodejs.org](https://nodejs.org) or with `nvm install 22`.
- **A PostgreSQL database.** Pick one:
  - **Neon (easiest, nothing to install):** sign up at [neon.tech](https://neon.tech), create a
    project, and copy the connection strings from **Connect**. Making a separate `dev` branch in
    Neon keeps your test data away from the live site.
  - **Postgres on your machine with Docker:**
    ```bash
    docker run -d --name dumpster-db -p 5432:5432 \
      -e POSTGRES_USER=waste -e POSTGRES_PASSWORD=waste -e POSTGRES_DB=dumpster_dashboard \
      postgres:16
    ```
    Your connection string is then
    `postgresql://waste:waste@localhost:5432/dumpster_dashboard`.

### 2. Set up the project

From this folder:

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | What to put |
|---|---|
| `DATABASE_URL` | Database connection string (Neon: the **pooled** one) |
| `DATABASE_URL_UNPOOLED` | Neon: the **direct** connection string. Local Postgres: same as `DATABASE_URL` |
| `AUTH_SECRET` | Any long random string. Generate one with `openssl rand -base64 32` |
| `ADMIN_USERNAME` | Admin login name (default `admin`) |
| `ADMIN_PASSWORD` | Admin password, at least 8 characters |

`.env` holds passwords, so it is gitignored. Never commit it.

### 3. Install, create the tables, and start

```bash
npm install                # installs packages and generates the Prisma client
npx prisma migrate deploy  # creates the tables
npm run seed               # creates the admin login + 50 demo pickups and 4 demo bins
npm run dev                # starts the app
```

Open **http://localhost:3000**, then log in with your `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
The driver form is at http://localhost:3000/records/new and doesn't need a login.

- Skip the demo data with `SEED_DEMO_DATA=false npm run seed`.
- Change the admin password by editing `ADMIN_PASSWORD` in `.env` and running `npm run seed` again.
- Check for type errors with `npm run typecheck`.

### Troubleshooting

- **`AUTH_SECRET is not set`**: `.env` is missing or not filled in.
- **`Can't reach database server`**: the database isn't running, or `DATABASE_URL` is wrong.
- **`The table ... does not exist`**: run `npx prisma migrate deploy`.
- **CSV upload fails**: upgrade to Node 20 or newer.
- **QR scanner can't open the camera**: the camera needs HTTPS. It works on `localhost` and on
  the deployed Vercel site, but not from another device at your computer's IP address.

## Deploy (Neon + Vercel)

1. **Neon:** create a project at neon.tech. Note both connection strings: pooled and direct ("unpooled").
2. **Vercel:** import the GitHub repo. Set **Root Directory** to this folder, then add these environment variables:
   - `DATABASE_URL`: Neon pooled connection string
   - `DATABASE_URL_UNPOOLED`: Neon direct connection string
   - `AUTH_SECRET`: a long random string (`openssl rand -base64 32`)

   (Or add Neon through Vercel's Storage tab / Neon integration, which sets both database variables for you.)
3. Deploy. The `vercel-build` script runs `prisma migrate deploy`, so the tables are created automatically.
4. **Create the admin login** (one time, from your machine). Point `.env` at the Neon database, then run:
   ```bash
   npm run seed
   ```
   Use a strong `ADMIN_PASSWORD`: the deployed site is public.

## Bin QR codes

1. On **Bins & QR Codes**, add a bin (ID, location, waste stream). Its QR code appears right away,
   ready to download as a PNG or print. Any bin's code can be shown again from the table.
2. Stick the printed code on the bin.
3. A driver scans it with **Scan Bin QR Code** on the pickup form, or with the phone's normal camera
   app. Either way the form opens with the bin's location, ID and waste stream filled in.

QR codes contain the full link (`https://<site>/records/new?bin=<ID>`), so **print them from the
deployed Vercel site, not from localhost**.

## CSV import/export

Columns: `collectionDate, building, location, binId, driverName, wasteStream, fullnessPercent, contamination, overflow, comments`.
Dates use `yyyy-MM-dd HH:mm` in campus time. `wasteStream` is `LANDFILL`, `RECYCLING` or
`ORGANICS`; `contamination` is `NONE`, `A_LITTLE` or `A_LOT`. Rows that don't parse are skipped and
counted. Files are limited to 4 MB.

## Changing the database schema

Edit `prisma/schema.prisma`, then run `npx prisma migrate dev --name what_changed` and commit the
new folder under `prisma/migrations/`. Vercel applies it on the next deploy.

## Project layout

```
app/            pages, server actions (actions.ts), chart + drag/resize components
app/records/    records list, pickup form (+ QR scanner), CSV export route
app/bins/       bin registry and QR code generator
lib/            db client, auth (signed cookie), filters, metrics, CSV, campus time helpers
lib/catalog.ts  campus building/location list (from the Service Overview spreadsheet)
prisma/         schema, migrations, seed script
```
