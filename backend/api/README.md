# Memoneo API

TypeScript REST API for encrypted notes.

Runtime dependencies:
- Bun
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
bun run db:generate
bun run db:migrate
```
