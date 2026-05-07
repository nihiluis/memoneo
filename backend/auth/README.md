# Memoneo Auth

Postgres-backed username/email and password auth service.

It owns:
- `users`
- `enckeys`

It issues RS256 JWT bearer tokens and exposes verification keys at:
- `GET /publickey`
- `GET /.well-known/jwks.json`

Required environment:
```bash
PORT=8089
DB_HOST=localhost
DB_PORT=5432
DB_STORE=memoneo
DB_USER=postgres
DB_PASSWORD=postgres
AUTH_JWT_SIGNING_KEY="-----BEGIN RSA PRIVATE KEY-----..."
AUTH_JWT_KID=memoneo-auth
AUTH_COOKIE_DOMAIN=localhost
```
