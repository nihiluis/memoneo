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
AUTH_JWT_SIGNING_KEY="LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQo..."
AUTH_JWT_KID=memoneo-auth
AUTH_JWT_ISSUER=memoneo-auth
AUTH_JWT_AUDIENCE=memoneo
AUTH_COOKIE_DOMAIN=localhost
```

`AUTH_JWT_SIGNING_KEY` should be a base64-encoded RSA private key PEM. Generate
one with:

```bash
openssl genrsa 2048 | base64 | tr -d '\n'
```

The service also accepts raw PEM for local use, either PKCS#1
(`-----BEGIN RSA PRIVATE KEY-----`) or PKCS#8 (`-----BEGIN PRIVATE KEY-----`).

Database migrations run automatically during service startup. Add new auth
schema changes in `internal/migrations` using Bun's migration registry.
