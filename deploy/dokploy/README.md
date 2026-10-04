# Memoneo on Dokploy over Tailscale

Use `compose.yaml` as a **raw Docker Compose** service. Web, API and auth use
published GHCR images (`WEB_IMAGE`, `API_IMAGE` and `AUTH_IMAGE`) pinned to release
versions. Both backend services connect to your external PostgreSQL database.
The Dokploy host needs access to GHCR to pull the images.

In the service's **Environment** tab, paste `.env.example` and fill in:

- `DATABASE_URL`: your existing database connection URL, including its host,
  port, database, credentials and TLS mode, for example
  `postgres://USER:URL_ENCODED_PASSWORD@100.108.216.27:5485/DB_NAME?sslmode=disable`.
  URL-encode special characters in the username/password. Use the TLS mode
  required by your database provider; this server uses `sslmode=disable`.
  For a database reached over Tailscale,
  use its Tailscale IP or full MagicDNS hostname and its PostgreSQL port.
  The Dokploy host and its containers must be able to reach that address.
- `AUTH_JWT_SIGNING_KEY`: a base64-encoded RSA private key. Generate one with
  `openssl genrsa 2048 | openssl base64 -A`.

Keep the signing key stable across redeployments. If using an existing Memoneo
database, reuse its signing key. Both services use the same `DATABASE_URL`; no
local database container or volume is created. Database migrations run on startup,
so use the intended Memoneo database and a role authorized to apply its migrations.

The default origin is `https://my-k8s.tail742bf.ts.net:8443`. On the Dokploy host,
check `tailscale serve status`, then add a dedicated HTTPS listener:

```sh
sudo tailscale serve --bg --https=8443 http://127.0.0.1:18080
```

Tailscale may prompt you to enable HTTPS in the tailnet admin console. This uses
the existing server's Tailscale hostname and does not require a custom domain.
Port 8443 must be allowed by your tailnet policy. The Compose web port binds only
to loopback; auth and API have no published ports.

Save the environment and click **Deploy**. Once the build finishes, open the
origin from a device connected to Tailscale. The released web app uses the current browser origin to choose these defaults:

- Notes API: `https://my-k8s.tail742bf.ts.net:8443/api`
- Authentication: `https://my-k8s.tail742bf.ts.net:8443/auth`

The same URLs work in the installed app and CLI. Auth uses host-only secure
cookies. The proxy serves web, API and auth from the same origin. The API runs its
database migrations before starting; auth runs its migrations at startup.

If you change `APP_ORIGIN`, redeploy to update the backend origin configuration.
The same web image works with different hostnames and ports. To update the app,
update `WEB_IMAGE`/`API_IMAGE`/`AUTH_IMAGE` to published release versions and redeploy. To stop this listener later,
run `sudo tailscale serve --https=8443 off`; this leaves other Serve listeners intact.
