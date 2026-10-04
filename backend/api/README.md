# Memoneo API

TypeScript REST API for encrypted notes.

Runtime dependencies:
- Node.js
- pnpm
- Postgres
- Auth service JWKS endpoint

Endpoints:
- `GET /health`
- `GET /notes`
- `GET /notes/ids`
- `POST /notes/bulk`
- `PUT /note`
- `PUT /notes/:id`
- `PATCH /notes/:id/archive`
- `DELETE /notes`
- `PUT /notes/:id/file`
- `GET /openapi`

Database:
```bash
pnpm db:generate
pnpm db:migrate
```

Browser connections:

Set `ALLOW_ORIGINS` to a pipe-separated list of permitted web app origins.
The default permits `http://localhost:8081` and `http://localhost:8080`.
Configure the authentication service to allow the same web app origin.
The web app can save its notes API and authentication base URLs in Settings
and check both services before signing in.
