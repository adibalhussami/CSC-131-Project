# Dumpster Dashboard (CSC 131)

Campus waste-collection dashboard for Sacramento State. Drivers sign in on their phones, scan the
QR code on a bin and log its condition. Supervisors see fullness, contamination, overflow and cost
across campus, and anyone in the field can plan a route on a 3D campus map.

Built with Next.js 15 (React 19, TypeScript) and Prisma, using a PostgreSQL database.
It is hosted on **Vercel** with a **Neon** database. The map uses MapLibre GL with free
OpenStreetMap data (no API keys).

## Contents

- [Pages](#pages)
- [Roles and sign-in](#roles-and-sign-in)
- [Logging a pickup (QR flow)](#logging-a-pickup-qr-flow)
- [Campus map and route planning](#campus-map-and-route-planning)
- [Going live: clearing the demo data](#going-live-clearing-the-demo-data)
- [Run it on your computer](#run-it-on-your-computer)
- [Deploy (Neon + Vercel)](#deploy-neon--vercel)
- [Bin QR codes](#bin-qr-codes)
- [CSV import/export](#csv-importexport)
- [Map data](#map-data)
- [Changing the database schema](#changing-the-database-schema)
- [Project layout](#project-layout)

## Pages

| Page | Who | What |
|---|---|---|
| `/` | Employee, Admin | Campus overview: filters, scorecards with sparklines, status/trend/building charts, top problem buildings, needs-attention list. Cards can be dragged and resized (saved per browser). |
| `/records/new` | Driver, Employee, Admin | Pickup form. Scanning a bin's QR code locks in its location, ID, waste stream and container size, so the driver only answers questions about the bin's condition. The driver's name comes from their login. |
| `/map` | Driver, Employee, Admin | 3D campus map. Buildings are colored by status; tap one for details. Pick stops, press **Optimize**, and get the shortest walking loop along campus paths. |
| `/records` | Employee, Admin | Every pickup, with filters and CSV export, plus a **Delete** button per record. CSV import is admin-only. |
| `/bins` | Employee (view), Admin (manage) | Bin registry and QR codes. Employees can view/print existing codes; only admins can add or remove bins. |
| `/cost` | Employee, Admin | Estimated scheduled vs. actual pickup cost by building and waste stream, using the rates set on `/settings`. |
| `/settings` | Admin | Add drivers and issue/reset their PINs, edit $/pickup rates, and delete demo data (or all records/bins). |
| `/driver/login` | — | Driver sign-in with username + 6-digit PIN. |
| `/login` | — | Staff (employee/admin) sign-in with username + password. |

Fullness status: GREEN 0–49%, YELLOW 50–79%, RED 80–100%. Times are shown in campus time (Pacific).

## Roles and sign-in

Three account types, set by each user's `role` column:

| Role | Signs in with | Can use |
|---|---|---|
| **Driver** | Username + 6-digit PIN at `/driver/login` | Pickup form and campus map only |
| **Employee** | Username + password at `/login` | Dashboard, pickup form, records (view, delete), map, view-only Bins & QR Codes and Cost |
| **Admin** | Username + password at `/login` | Everything, plus adding/removing bins, CSV import and Settings |

Admin and employee logins are created by `npm run seed` from `.env`. Drivers are added on
**Settings → Drivers**.

### Driver accounts

1. An admin types the driver's name on **Settings → Drivers** and presses **Add Driver**.
2. The app creates a username (e.g. `maria.gonzalez`) and a random 6-digit PIN, and shows them
   **once**. Give both to the driver. The PIN is stored only as a bcrypt hash and is never put in a URL.
3. The driver signs in on their phone at `/driver/login` and stays signed in on that phone for
   **30 days**. Staff sessions last 12 hours and end when the browser closes.

Security rules:

- **Lockout:** five wrong PINs in a row lock the account for 15 minutes.
- **New PIN** (Settings) replaces the PIN and signs the driver out on every phone right away.
- **Deactivate** blocks the account and signs the driver out everywhere. **Reactivate** undoes it.
- Every pickup stores the signed-in driver's ID and name, so the name can't be typed in or faked.
- A driver who opens a staff page (dashboard, records, bins, cost, settings) is sent back to the
  pickup form.

## Logging a pickup (QR flow)

1. The driver scans the bin's QR code, either with **Scan Bin QR Code** on the pickup form or with
   the phone's normal camera app.
2. If they aren't signed in, they go to `/driver/login` first and then straight back to that bin.
3. The form shows a locked **bin card**: bin ID, building, location, waste stream, container size,
   scheduled pickups per week, and the last pickup at that bin. If it's the wrong bin, **Not this
   bin?** switches to the manual form.
4. The driver answers only the condition questions:
   - How full is it? (0 / 25 / 50 / 75 / 100%)
   - Contamination (none / a little / a lot)
   - Overflowing or waste outside the bin?
   - Was the service completed? (if no, why)
   - Maintenance issue or damaged bin? (if yes, describe it)
   - Comments (optional)
   - Container size, only if the bin record doesn't have one yet
5. On submit, the server takes the location, waste stream and container size from the **bin record
   in the database**, not from the form, so they can't be changed by editing the page.

Without a QR code (or for an unregistered bin), the form asks for location, bin ID, waste stream and
container size by hand.

## Campus map and route planning

`/map` shows every collection point on a 3D map of campus.

- **Colors:** the real building footprint is extruded in 3D and colored by its worst collection
  point. Status comes from the **most recent pickup of each waste stream** there, so a problem that
  was logged again as fixed no longer shows red.
  - **Red (needs work):** 80%+ full, overflowing, heavily contaminated, not serviced, or a
    maintenance issue.
  - **Yellow (watch):** 50–79% full or some contamination.
  - **Green (OK)**, **gray (no data for the current filters)**.
- **Details:** tap a building or pin to see what needs work, the latest pickup per waste stream
  (fullness, date, driver, comments), the scheduled service, and (for staff) a link to its records.
- **Views:** Map or Satellite basemap, 3D or 2D. Drag to pan, right-click drag (or Ctrl + drag)
  to rotate and tilt, scroll to zoom. Staff also get the usual filter bar (building, driver, waste
  stream, dates).

### Planning a route

1. Pick the buildings to visit: tap one and choose **Add to route**, turn on **Pick stops on map**
   and tap buildings, or use **Add all red** / **Add all yellow**.
2. Press **Optimize route**.
3. The app finds the shortest loop that starts and ends at Facilities Management, numbers the stops
   on the map and in the list, and draws the route **along campus walkways and sidewalks**. It shows
   total distance and an estimated time (walking pace plus 4 minutes per stop).
4. Adding or removing a stop marks the route out of date until you press **Re-optimize**.

How it works: the walkway network (`public/campus-paths.json`) is loaded into the browser. Each stop
is snapped to its nearest path, Dijkstra's algorithm gives real walking distances between every pair
of stops, and the stop order is optimized with a nearest-neighbour tour followed by 2-opt
improvement. Routing runs entirely in the browser and needs no outside service. If the walkway file
can't load, the route falls back to straight lines and says so.

## Going live: clearing the demo data

`npm run seed` creates 50 demo pickups and 4 demo bins, all flagged `isDemo`. Demo data created
before that flag existed (bin IDs `SIM-001`…`SIM-050` and the four seed bins) was flagged
automatically by the `drivers_bin_details_demo_flags` migration.

On **Settings → Data**, an admin chooses what to delete, types `DELETE`, and presses **Delete**:

| Option | Deletes |
|---|---|
| Demo data only | Pickups and bins flagged as demo |
| All pickup records | Every pickup record; bins stay |
| Everything | Every pickup record and every bin |

Logins, drivers and cost rates are never deleted there, and deleting can't be undone. Export the
records to CSV first if you might want them. On a real database, run the seed with
`SEED_DEMO_DATA=false` so the demo data isn't created again.

## Run it on your computer

### 1. Install the requirements

- **Node.js 22** (20 or newer works; on Node 18 the CSV upload fails). Check with `node -v`.
  Get it from [nodejs.org](https://nodejs.org) or with `nvm install 22`.
- **A PostgreSQL database.** Pick one:
  - **Postgres on your machine with Docker (recommended for testing):** install
    [Docker Desktop](https://www.docker.com/products/docker-desktop/), open it, then run
    `docker compose up -d` in this folder. Your connection string is
    `postgresql://dashboard:dashboard@localhost:5433/dumpster_dashboard`
    (port **5433**, not 5432, to avoid clashing with a Postgres install already on the default port).
  - **Neon (nothing to install):** sign up at [neon.tech](https://neon.tech), create a project, and
    copy the connection strings from **Connect**. Use a separate `dev` branch in Neon so your test
    data stays away from the live site.

### 2. Set up the project

From this folder, copy the example settings file:

```bash
cp .env.example .env            # macOS / Linux / Git Bash
Copy-Item .env.example .env     # Windows PowerShell
```

Open `.env` and fill in:

| Variable | What to put |
|---|---|
| `DATABASE_URL` | Database connection string (Neon: the **pooled** one) |
| `DATABASE_URL_UNPOOLED` | Neon: the **direct** connection string. Local Postgres: same as `DATABASE_URL` |
| `AUTH_SECRET` | Any long random string. Generate one with `openssl rand -base64 32` |
| `ADMIN_USERNAME` | Admin login name (default `admin`) |
| `ADMIN_PASSWORD` | Admin password, at least 8 characters |
| `EMPLOYEE_USERNAME` | Optional employee login name |
| `EMPLOYEE_PASSWORD` | Required if `EMPLOYEE_USERNAME` is set, at least 8 characters |
| `DRIVER_USERNAME` | Optional test driver login name (real drivers are added on Settings) |
| `DRIVER_NAME` | Name shown on the test driver's pickups (defaults to the username) |
| `DRIVER_PIN` | Required if `DRIVER_USERNAME` is set: exactly 6 digits |

`.env` holds passwords, so it is gitignored. Never commit it.

### 3. Install, create the tables, and start

```bash
npm install                # installs packages, generates the Prisma client, copies the map worker
npx prisma migrate deploy  # creates the tables
npm run seed               # creates the logins, 50 demo pickups and 4 demo bins
npm run dev                # starts the app
```

Open **http://localhost:3000**:

- Staff: **http://localhost:3000/login** with `ADMIN_USERNAME` / `ADMIN_PASSWORD`
  (or the employee login).
- Driver: **http://localhost:3000/driver/login** with `DRIVER_USERNAME` / `DRIVER_PIN`, or a driver
  you added on Settings.
- To test the QR flow without printing a code, open
  `http://localhost:3000/records/new?bin=ALP-LF-01` (one of the demo bins).

### Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the app for development |
| `npm run typecheck` | Check for TypeScript errors |
| `npm run build` | Production build (stop `npm run dev` first; both use the `.next` folder) |
| `npm run seed` | Create/update logins, cost rates and (unless `SEED_DEMO_DATA=false`) demo data |
| `npm run map:buildings` | Re-download building shapes and heights from OpenStreetMap |
| `npm run map:paths` | Re-download the campus walkway network from OpenStreetMap |
| `docker compose up -d` / `docker compose down` | Start / stop the local database (`down -v` also wipes it) |

Change a password or test PIN by editing `.env` and running `npm run seed` again.

### Troubleshooting

- **`failed to connect to the docker API`**: Docker Desktop isn't open. Start it and wait until
  `docker info` works.
- **`AUTH_SECRET is not set`**: `.env` is missing or not filled in.
- **`Can't reach database server`**: the database isn't running, or `DATABASE_URL` is wrong.
- **`The table ... does not exist`** or a missing column: run `npx prisma migrate deploy`.
- **`EPERM ... query_engine-windows.dll.node`** when running Prisma: stop `npm run dev` first
  (it locks that file on Windows), then run the command again.
- **Map area is blank**: the basemap and satellite tiles load from the internet. Check your
  connection. If buildings or pins are missing, make sure `public/maplibre-gl-worker.mjs` exists
  (`npm install` creates it).
- **CSV upload fails**: upgrade to Node 20 or newer.
- **QR scanner can't open the camera**: the camera needs HTTPS. It works on `localhost` and on
  the deployed Vercel site, but not from another device at your computer's IP address.
- **Driver says "locked"**: wait 15 minutes, or have an admin press **New PIN** on Settings.

## Deploy (Neon + Vercel)

1. **Neon:** create a project at neon.tech. Note both connection strings: pooled and direct ("unpooled").
2. **Vercel:** import the GitHub repo. Set **Root Directory** to this folder, then add these environment variables:
   - `DATABASE_URL`: Neon pooled connection string
   - `DATABASE_URL_UNPOOLED`: Neon direct connection string
   - `AUTH_SECRET`: a long random string (`openssl rand -base64 32`)

   (Or add Neon through Vercel's Storage tab / Neon integration, which sets both database variables for you.)
3. Deploy. The `vercel-build` script runs `prisma migrate deploy`, so tables and new columns are
   created automatically. `npm install` on Vercel also copies the map worker into `public/`.
4. **Create the admin login** (one time, from your machine). Point `.env` at the Neon database, then run:
   ```bash
   npm run seed
   ```
   Use a strong `ADMIN_PASSWORD`: the deployed site is public. Leave `DRIVER_USERNAME` unset for
   production and add real drivers on Settings instead.
5. **Before drivers start:** add each driver on **Settings → Drivers** (the pickup form requires a
   login), set container sizes on the bins, and clear the demo data on **Settings → Data**.

## Bin QR codes

1. On **Bins & QR Codes**, add a bin: ID, location, waste stream, and container size. Leave the size
   as "Ask the driver each time" if you don't know it. Its QR code appears right away, ready to
   download as a PNG or print. Any bin's code can be shown again from the table.
2. Stick the printed code on the bin.
3. A signed-in driver scans it and gets the locked bin card described in
   [Logging a pickup](#logging-a-pickup-qr-flow).

QR codes contain the full link (`https://<site>/records/new?bin=<ID>`), so **print them from the
deployed Vercel site, not from localhost**.

## CSV import/export

Columns: `collectionDate, building, location, binId, driverName, wasteStream, fullnessPercent, contamination, overflow, comments`.
Dates use `yyyy-MM-dd HH:mm` in campus time. `wasteStream` is `LANDFILL`, `RECYCLING` or
`ORGANICS`; `contamination` is `NONE`, `A_LITTLE` or `A_LOT`. Rows that don't parse are skipped and
counted. Files are limited to 4 MB. Imported records keep the driver name from the file and aren't
linked to a driver account.

## Map data

All map data comes from [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.

| File | What | Made by |
|---|---|---|
| `lib/geo.ts` | Coordinates for every collection point in `lib/catalog.ts`, which OSM building each belongs to, and the route optimizer | Hand-maintained. Points marked `approx: true` were placed by hand because OSM has no matching building. Check them on the map and correct them here. |
| `public/campus-buildings.geojson` | Building footprints and heights around campus | `npm run map:buildings` (`scripts/fetch-campus-buildings.mjs`) |
| `public/campus-paths.json` | Walkable network (footpaths, sidewalks, service roads) for routing | `npm run map:paths` (`scripts/fetch-campus-paths.mjs`) |
| `public/maplibre-gl-worker.mjs` | MapLibre's rendering worker, copied from `node_modules` | `npm install` (`scripts/copy-maplibre-worker.mjs`); gitignored |

Most campus buildings have no height in OSM, so `scripts/fetch-campus-buildings.mjs` has a table of
estimated floor counts. A real OSM height always wins. The Aquatic Center at Lake Natoma is shown on
the map but left out of routes. Basemaps: [OpenFreeMap](https://openfreemap.org) (street) and Esri
World Imagery (satellite).

## Changing the database schema

Edit `prisma/schema.prisma`, then run `npx prisma migrate dev --name what_changed` and commit the
new folder under `prisma/migrations/`. Vercel applies it on the next deploy.

Main tables: `app_user` (staff and drivers, with `role`), `pickup_record` (one row per pickup,
linked to the driver when logged by one), `bin` (registered bins with QR codes), and `cost_rate`.

## Project layout

```
app/                    pages, server actions (actions.ts), chart + drag/resize components
app/Sidebar.tsx         left nav, filtered by role; app/AppShell.tsx wraps it around every page
app/login/              staff sign-in (username + password)
app/driver/login/       driver sign-in (username + PIN)
app/records/            records list (view/delete), pickup form + bin card + QR scanner, CSV export route
app/map/                campus map page and the 3D map / route planner component (CampusMap.tsx)
app/bins/               bin registry and QR code generator (view for employees, manage for admins)
app/cost/               scheduled vs. actual pickup cost by building/waste stream
app/settings/           admin-only: drivers and PINs, $/pickup rates, data reset
lib/auth.ts             sessions (signed cookie), role checks, driver session validation
lib/drivers.ts          one-time display of a new driver PIN on Settings
lib/catalog.ts          campus building/location list + weekly service levels (from the Service Overview spreadsheet)
lib/geo.ts              map coordinates per location, distance helper, route-order optimizer
lib/mapData.ts          turns pickup records into per-site map status and details
lib/walkRoute.ts        walkway graph, Dijkstra shortest paths, walking route planner
lib/                    db client, filters, metrics, costs, CSV and time helpers
public/                 map data files (see "Map data")
scripts/                OpenStreetMap download scripts and the MapLibre worker copy step
prisma/                 schema, migrations, seed script
docker-compose.yml      local Postgres for development
```
