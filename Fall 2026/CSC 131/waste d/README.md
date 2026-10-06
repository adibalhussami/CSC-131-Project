# Waste Collection Dashboard
1. `cp .env.example .env` and fill in DATABASE_URL and AUTH_SECRET
2. `npm install`
3. `npx prisma migrate dev --name init`
4. `npm run seed` (creates admin / changeme123 plus sample bins; change the password)
5. `npm run dev`

Bin QR codes are made in Admin > Bins and QR codes. Each one opens `https://YOURSITE/log?bin=LIB-001`.
