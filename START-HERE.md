# Start here: run JYC Connect on Windows

This ZIP contains the frontend and backend source code. It does **not** include installed packages or a live database. Follow these steps on your computer.

## Before you start

Install these two programs first:

1. **Node.js 20 or newer** (includes `npm`). After installing, open PowerShell and check `node --version` and `npm --version`.
2. **PostgreSQL 14 or newer**. During setup, remember the database password you choose for the `postgres` user. The PostgreSQL installer may offer to install pgAdmin; that makes creating a database easier.

You also need working SMTP email settings before student registration can send OTP codes. Without SMTP, the site can start, but registration will show an email configuration error. The app never pretends an email was sent.

## 1. Unzip the project

In File Explorer, right-click `jyc-connect-project.zip` and choose **Extract All**. Open the extracted `jyc-connect` folder.

## 2. Create the database

Open pgAdmin, connect to your local PostgreSQL server, right-click **Databases**, choose **Create > Database**, and name it:

```text
jyc_connect
```

## 3. Configure and start the backend

Open a PowerShell window in the extracted `jyc-connect` folder, then run:

```powershell
cd backend
Copy-Item .env.example .env
notepad .env
```

In Notepad, set these values in `.env`:

- `DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/jyc_connect?schema=public` — replace `YOUR_POSTGRES_PASSWORD` with the password you chose during PostgreSQL setup.
- `AUTH_JWT_SECRET` — replace the example text with a random secret. Generate one by running `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` in another PowerShell window.
- `OTP_PEPPER` — generate a second random value using the same command. Keep this value different from `AUTH_JWT_SECRET`.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` — enter the credentials for a real email provider. Ask whoever manages your organization’s email account if you do not have these values.
- Leave `FRONTEND_ORIGIN=http://localhost:5173` and `STORAGE_DRIVER=local` as they are for local development.

Save and close Notepad. Back in the `backend` folder, run:

```powershell
npm install
npm run prisma:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Keep this PowerShell window open. The last command starts the backend. The seed command adds the official council list supplied with the project. It does not reset the database.

## 4. Start the website

Open a **second** PowerShell window in the extracted `jyc-connect` folder and run:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open the local address printed in that window. It is usually [http://localhost:5173](http://localhost:5173).

## What you should expect

- The home page and public pages request their content from the backend.
- The council appears after the database seed completes.
- The About JYC page shows Dr. Rakhi Pandey, listed by Jaypee University's official website as Faculty Incharge (Student Welfare). Her photo is intentionally not copied from elsewhere: a JYC administrator can upload/replace it from the About page.
- Hubs, events, announcements, and photos start empty until an authorized manager adds real JYC information. The supplied event/hub preview records were labeled as samples, so they are not inserted as if they were official information.
- Registration sends an actual email OTP only after SMTP is configured.
- To get the admin photo/name editor: first create your normal account and verify its email. Stop the backend with `Ctrl+C`. In pgAdmin, open the `jyc_connect` database, open **Tools > Query Tool**, and run the SQL below after replacing the email with your registered email. This grants admin access only to that specified account. Then start the backend again, log out/in in the browser, and open **About JYC**. The faculty card will show the edit fields and photo upload button. Any account whose role is ADMIN can manage it.

```sql
UPDATE "User" SET "role" = 'ADMIN' WHERE "email" = 'your-registered-email@example.com';
```

Choose a JPG, PNG, WebP, or GIF photo no larger than 8 MB. It is uploaded to the configured image storage and can be replaced later by any administrator. In production, configure S3-compatible storage rather than local disk.

## If something goes wrong

- `npm` or `node` is “not recognized”: install Node.js, close PowerShell, open it again, and retry.
- PostgreSQL connection error: check PostgreSQL is running, the password in `DATABASE_URL` is correct, and the database is named `jyc_connect`.
- CORS/network error in the browser: make sure the backend is running and `FRONTEND_ORIGIN` is exactly `http://localhost:5173`.
- OTP email error: confirm all SMTP values with your email provider. Registration will not succeed until the backend can send the email.
- `npm install` cannot reach the registry: check your internet connection or ask your network administrator whether npm downloads are blocked.

For API details and production deployment settings, see `backend/README.md` and `frontend/.env.example`.
