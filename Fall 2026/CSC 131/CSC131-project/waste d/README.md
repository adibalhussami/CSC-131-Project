# How to Run Locally

Must be installed: Node.js and Docker.
Make sure the Docker Desktop application is open and running.

Open 'waste d' directory in terminal and enter:
1. `cp .env.example .env`
2. `npm install`
3. `npm audit fix --force`
4. `npm install-scripts approve -a`
5. `docker-compose up -d`
6. `npx prisma migrate dev --name init`
7. `npm run seed`
8. `npm run dev`

In your web browser, go to URL: "http://localhost:3000/"
The admin username is "admin", and the password is "changeme123".

# QR Codes

Bin QR codes are made in Admin > Bins and QR codes. Each one opens `https://YOURSITE/log?bin=LIB-001`.
