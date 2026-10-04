# Web container releases

The web image contains the Expo web export and Nginx. It serves on port 80 and
proxies `/api` to `api:8073` and `/auth` to `auth:8089` on its container network.
Backend URLs default to the browser's current origin, including any port.
Explicit build configuration and URLs saved in Settings take precedence.

Build locally from the repository root:

```sh
docker build -f deploy/web/Dockerfile -t memoneo-web:local .
```

To publish a new version, create and push a `web@vX.Y.Z` tag pointing to the
reviewed source commit. The `Release Web` workflow runs tests, typechecks and
lint, publishes `ghcr.io/nihiluis/memoneo-web:vX.Y.Z` for Linux amd64 and arm64,
and creates a GitHub release. Alternatively, run that workflow with an existing
tag. Web versions are independent of the Android app's Changesets versions.

Use the image with the [Dokploy Compose stack](../dokploy/compose.yaml).
Environment variables for the web origin and database are configured on the
backend services; no deployment secrets are embedded in the web image.
