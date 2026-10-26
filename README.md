# JYC Connect integrated project

This folder contains the existing React/Vite frontend and the Express/PostgreSQL/Prisma backend. The existing UI and logo are preserved. The frontend now reads hub, event, council, gallery, site background, announcement, and student dashboard data from backend endpoints; auth and registration use the backend's cookie and OTP flows.

## Local setup

Use Node.js 20 or newer and PostgreSQL 14 or newer. Run the frontend and backend in separate terminals.

### Backend

1. `cd backend`
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `FRONTEND_ORIGIN=http://localhost:5173`, strong `AUTH_JWT_SECRET` and `OTP_PEPPER` values, and working SMTP settings.
3. `npm install`
4. `npm run prisma:generate`
5. `npm run db:migrate` (applies the additive migration; does not reset or drop data)
6. `npm run db:seed` to insert/upsert the supplied official council list.
7. `npm run dev`

For registration, working email delivery is required. If SMTP is missing or send fails, the backend returns an error and does not report a successful OTP request.

### Frontend

1. `cd frontend`
2. Copy `.env.example` to `.env.local`; set `VITE_API_URL=http://localhost:4000` for local development.
3. `npm install`
4. `npm run dev` (the frontend is allowed by the backend's local CORS origin `http://localhost:5173`).

For deployment, set `VITE_API_URL` to the public API origin at frontend build time and set backend `FRONTEND_ORIGIN` to the exact deployed frontend origin. These values must agree. Use HTTPS, `AUTH_COOKIE_SECURE=true`, and set `AUTH_COOKIE_SAME_SITE=none` only when frontend and API are cross-site; cross-site cookies require Secure. Never place server credentials in frontend environment variables.

## Backend managed images

The public routes return media URLs in hub `imageUrl`, event `imageUrl`, council `photoUrl`, gallery `url`, and site asset `url` fields. Admins/coordinators can upload gallery media with `POST /api/admin/images` using an image body, attach a hub/event/council photo with `POST /api/admin/media/:kind/:id`, and configure page backgrounds with `PUT /api/admin/assets/:slot`. Site slots are `hero`, `login`, `register`, `about`, and `campus`. Local storage is for development; production requires configured S3-compatible storage. The frontend keeps the supplied logo as its brand mark.

## Checks

Run `npm test` and `npm run build` from `frontend`. Run `npm test` and `npm run prisma:validate` from `backend`. The backend requires a configured database to apply migrations. Current records such as events, hubs, announcements, and photos must be added by an authorized manager; the only provided production content list is the official council list.
