# Release Process

Releases are package based and versioned with Changesets.

## Add a release note

When a change should release one or more packages, create a changeset from the repo root:

```sh
pnpm changeset
```

Select the changed packages and bump type. The current releasable packages are:

- `@memoneo/api`: backend API Docker image.
- `@memoneo/auth`: auth Go binary and Docker image.
- `@memoneo/cli`: CLI package.
- `@memoneo/app`: Android APK.
- `@memoneo/shared`: shared frontend package.

## Automatic versioning

When changesets land on `main`, the `Changesets` workflow opens or updates a `Version packages` PR.

Merging that PR:

1. Updates package versions independently.
2. Removes consumed changeset files.
3. Triggers `Release Tags`, which creates package tags for changed package versions.
4. Triggers `Release`, which builds and publishes GitHub Release artifacts for each package tag.

Package tags use this format:

```txt
api@v0.1.0
auth@v0.1.0
cli@v0.1.0
app@v0.1.0
shared@v0.1.0
```

## Release artifacts

- `api@vX.Y.Z`: `memoneo-api-api-vX.Y.Z.tar.gz`
- `auth@vX.Y.Z`: `memoneo-auth-auth-vX.Y.Z.tar.gz`, `memoneo-auth`
- `cli@vX.Y.Z`: packed CLI `.tgz`
- `app@vX.Y.Z`: `memoneo-android-app-vX.Y.Z.apk`
- `shared@vX.Y.Z`: packed shared package `.tgz`

## Local checks

Run these before merging releaseable work when possible:

```sh
cd backend/api
pnpm test
pnpm check

cd ../auth
go test ./...
go build .

cd ../../frontend
pnpm test
pnpm typecheck
pnpm lint
pnpm build:cli
pnpm build:app:android
```

## Current limitations

- Android currently uses the checked-in debug signing configuration for release builds. Before distributing outside local testing, add release keystore secrets and wire them into `frontend/apps/app/android/app/build.gradle`.
- Docker images are exported as release artifacts instead of being pushed to a registry. If you want deployable images, add GHCR publishing after the package-tag flow is working.
- The API service is validated with tests and `tsc --noEmit`; it currently runs from TypeScript in the Docker image instead of producing a compiled JS artifact.
