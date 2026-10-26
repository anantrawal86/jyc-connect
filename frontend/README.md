# JYC Connect frontend

React and TypeScript frontend for the JYC Connect campus community platform.

## Run locally

1. Install Node.js 20 or newer.
2. Install dependencies with `npm install`.
3. Start the frontend with `npm run dev`.

The frontend runs at `http://localhost:5173` by default. To connect it to a local API, set `VITE_API_URL=http://localhost:4000` in `frontend/.env.local`. Do not put server secrets or database credentials in frontend environment variables.

See the repository's `README.md` for backend, database, and deployment setup.
