# JYC Connect backend

Express/JavaScript API designed against the React frontend's `src/services/api.ts` routes. It uses PostgreSQL through Prisma, HTTP-only cookie sessions, email OTP verification, and metadata-only image records. No frontend files are included or changed.

## Setup

1. Install Node.js 20 or newer and PostgreSQL 14 or newer.
2. Copy `.env.example` to `.env`, set a database and unique secrets, and configure a real SMTP account. Never put server secrets in `VITE_*` variables.
3. Install dependencies: `npm install`.
4. Generate Prisma client: `npm run prisma:generate`.
5. Apply the checked-in additive migration: `npm run db:migrate`.
6. Optional: `npm run db:seed` adds the official 2026–2027 council records from the supplied frontend list and the faculty coordinator profile. The seed uses upserts and does not reset or drop data.
7. Start with `npm run dev` (or `npm start` in deployment).

Public registration always creates a `STUDENT`. To provision the first administrator, first create and verify that person's account, then promote only that known email through a controlled database session, for example `UPDATE "User" SET "role" = 'ADMIN' WHERE "email" = 'trusted-admin@example.org';`. Restrict DB access and do not expose an admin role selector in registration.

For schema changes during local development use `npm run db:dev`; review generated migrations before applying them. Production uses `prisma migrate deploy`. Neither command resets the database.

## Required configuration

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `FRONTEND_ORIGIN` | Exact allowed browser origin; credentials are enabled |
| `AUTH_JWT_SECRET` | At least 32 characters, unique and secret |
| `OTP_PEPPER` | Independent secret used to HMAC OTP values and contact IPs |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Real email delivery; registration fails closed if delivery is unavailable |
| `AUTH_COOKIE_SECURE` | Set `true` behind HTTPS in production |
| `AUTH_COOKIE_SAME_SITE` | `lax` for same-site deployments; use `none` with Secure cookies for cross-site frontend/API deployments |
| `STORAGE_DRIVER` | `local` only for local development; production must use `s3` |
| `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL` | Production S3-compatible storage; optionally set endpoint/path-style for compatible services |
| `PUBLIC_API_URL`, `LOCAL_STORAGE_DIR` | Public URL and local development image location |
| `OTP_TTL_MINUTES`, `OTP_RESEND_SECONDS`, `OTP_MAX_ATTEMPTS`, `OTP_VERIFICATION_TTL_MINUTES` | OTP and registration-grant lifecycle |

Set strong random secrets, restrict database credentials, use HTTPS, and serve S3 objects through a controlled public CDN/bucket policy. Local image serving is disabled in production. SMTP and object-storage credentials are server-only.

## API

All routes are under `/api`; errors use `{ "code": "...", "message": "..." }`.

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/health` | Public | Liveness |
| GET | `/hubs`, `/hubs/:id` | Public | Hub list/details |
| GET | `/events?status=upcoming\|past`, `/events/:id` | Public | Published event list/details |
| GET | `/council`, `/announcements` | Public | Official council and published notices |
| GET | `/faculty-coordinator` | Public | Faculty coordinator profile for About JYC |
| POST | `/auth/register/request-otp` | Public, rate-limited | Requires fullName, email, rollNumber; sends real email |
| POST | `/auth/register/verify-otp` | Public, rate-limited | Returns one-use verificationToken |
| POST | `/auth/register/complete` | Public, rate-limited | Requires verificationToken, fullName, email, rollNumber, password; creates STUDENT and signs in |
| POST | `/auth/login`, `/auth/logout` | Public | Login accepts email or rollNumber; logout clears cookie |
| GET | `/auth/me`, `/auth/profile` | Student session | Authenticated profile |
| GET | `/dashboard` | Student session | User and announcements |
| POST | `/contact` | Public, rate-limited | Validated, honeypot and timing check, IP rate limit |
| GET | `/gallery` | Public | Image metadata and URLs |
| GET | `/assets/:slot` | Public | `hero`, `login`, `register`, `about`, `campus` site asset |
| POST/PATCH | `/admin/hubs`, `/admin/hubs/:id` | ADMIN | Create/update hub details |
| POST/PATCH | `/admin/events`, `/admin/events/:id` | ADMIN or COORDINATOR | Create/update event; publishing requires that event's Google Form URL |
| POST/PATCH | `/admin/announcements`, `/admin/announcements/:id` | ADMIN or COORDINATOR (create); ADMIN (update) | Create, edit, and publish/unpublish announcements |
| POST | `/admin/images?alt=...&caption=...&category=...` | ADMIN or COORDINATOR | Raw image body, max 8 MiB |
| POST | `/admin/media/:kind/:id` | ADMIN or COORDINATOR | Attach uploaded image to `hub`, `event`, or `council` record; council ID is enrollment number |
| PUT | `/admin/assets/:slot?alt=...` | ADMIN | Raw image body for site background |
| DELETE | `/admin/gallery/:id` | ADMIN or COORDINATOR | Remove image metadata and local file |
| PATCH | `/admin/faculty-coordinator` | ADMIN | Update faculty coordinator name/designation |
| POST | `/admin/faculty-coordinator/photo` | ADMIN | Upload/replace coordinator photo (raw image, max 8 MiB) |

Coordinator details are seeded with the official title [Faculty Incharge (Student Welfare)](https://www.jaypeeu.ac.in/rakhi), matching Jaypee University's [telephone directory](https://www.jaypeeu.ac.in/telephonedirectory). The photo is blank until an administrator uploads one. Any ADMIN can edit it from the About JYC page after signing in.

## Tests and validation

Run `npm test` for security contract tests. Run `npm run prisma:validate` and `npm run prisma:generate` after configuring `.env`. Full database migration/application requires an accessible PostgreSQL server. Tests do not require a database connection.

The contact form currently accepts an optional `website` honeypot and `formStartedAt` timestamp; the current frontend sends neither, so backend IP throttling and field validation still apply. Configure client-side values in a future frontend update if desired.
