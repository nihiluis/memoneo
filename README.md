# Memoneo

Memoneo is a self-hosted notes stack with:

- a CLI to encrypt and sync markdown notes
- an Android app for transcribed voice notes
- backend services for auth and note APIs

## Project structure

### Frontend packages

- [Memoneo CLI](./frontend/apps/cli/README.md) - local markdown workflow and sync client
- [Memoneo app](./frontend/apps/app/README.md) - Android app for recording and syncing voice notes
- `@memoneo/shared` - shared frontend package used by the app and CLI

### Backend services

- [Memoneo API](./backend/api/README.md) - note API and releaseable backend service
- [Memoneo auth](./backend/auth/README.md) - authentication and authorization service

## Demo

Recording a voice message and uploading it to the Memoneo server:

https://github.com/user-attachments/assets/b1ededbe-1e05-4094-bf4a-611a1a3ed824

Syncing the text note to your computer via the CLI:

https://github.com/user-attachments/assets/8476bb5a-9f0d-464e-b396-85a8f7285312

## Releases

Memoneo uses Changesets for package-based releases.

1. From the repo root, run `pnpm changeset`.
2. Select the packages that should be released and choose the version bump.
3. Merge the changeset into `main`.
4. GitHub updates the `Version packages` PR.
5. Merging that PR creates tags like `api@v0.1.0` and publishes the release artifacts.

Releaseable packages:

- `@memoneo/api`
- `@memoneo/auth`
- `@memoneo/cli`
- `@memoneo/app`
- `@memoneo/shared`

Published artifacts:

- `api`: release tarball and GHCR image
- `auth`: release tarball, binary, and GHCR image
- `cli`: standalone binaries for Linux, macOS, and Windows
- `app`: Android APK
- `shared`: packed `.tgz` package

Recommended checks before merging releaseable work:

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