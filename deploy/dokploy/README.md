# Memoneo on Dokploy over Tailscale

Use `compose.yaml` as a **raw Docker Compose** service. Web, API and auth use
published GHCR images pinned to release versions. Both backend services connect
to your external PostgreSQL database. A Tailscale sidecar automatically loads
its Serve configuration and proxies private HTTPS on port 443 to `web:80`.
No container publishes a host port.

In the service's **Environment** tab, use `.env.example` and fill in:

- `APP_ORIGIN`: the HTTPS origin assigned to your sidecar by Tailscale.
  Use the actual hostname from your deployment; the URLs below are placeholders.
- `DATABASE_URL`: your existing database URL, including credentials and database
  name, for example
  `postgres://USER:URL_ENCODED_PASSWORD@DB_HOST:DB_PORT/DB_NAME?sslmode=disable`.
  URL-encode special characters in credentials. The Dokploy host and its
  containers must be able to reach this database address over Tailscale.
- `AUTH_JWT_SIGNING_KEY`: a base64-encoded RSA private key. Generate one with
  `openssl genrsa 2048 | openssl base64 -A`, or preserve the existing signing key.
- `TAILSCALE_AUTH_KEY` (optional): an auth key from the Tailscale admin console
  for automatic first login. Use a non-ephemeral key for this persistent app.
  Without a key, open the authentication link printed in the sidecar logs once.

Save and deploy. Authorize the sidecar in the intended tailnet if prompted.
The default hostname is `memoneo`. Replace `YOUR_TAILNET` in these example URLs
with the DNS name assigned by Tailscale:

- Web: `https://memoneo.YOUR_TAILNET.ts.net`
- Notes API: `https://memoneo.YOUR_TAILNET.ts.net/api`
- Authentication: `https://memoneo.YOUR_TAILNET.ts.net/auth`

If Tailscale assigns a different hostname because of a conflict, update
`APP_ORIGIN` to the assigned HTTPS URL and redeploy. HTTPS must be enabled in the
tailnet. Tailnet access rules control who can connect. Funnel is explicitly
disabled. No host-level `tailscale serve` command is needed.

The `tailscale_state` volume preserves the sidecar's identity across restarts
and redeployments. `TS_AUTH_ONCE=true` prevents unnecessary re-authentication.
Keep this volume when redeploying. An auth key's expiry does not delete an
already enrolled device; device key expiry is a separate Tailscale setting.
For unattended operation, configure device key expiry appropriately in the
Tailscale admin console. Changes to the mounted Serve configuration take effect
when the sidecar is recreated during deployment.

The browser chooses its own current origin for backend requests, so the same
released web image works with this hostname without rebuilding. Saved backend
URLs in Settings take precedence; update them if you previously saved the old
host URL. Auth uses host-only secure cookies. API and auth migrations run on
startup, so use the intended Memoneo database and an authorized migration role.

To update the app, change `WEB_IMAGE`, `API_IMAGE` or `AUTH_IMAGE` to another
published release and redeploy. `TAILSCALE_IMAGE` can override the pinned stable
Tailscale image. Keep actual tailnet hostnames, private database addresses,
database credentials and the signing key in Dokploy's environment settings
and out of Git.
