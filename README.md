# Memoneo
Memoneo provides a small cli to encrypt and sync your markdown notes to a Postgres database via a self-hosted backend.

## Project structure
## Frontends
- [Memoneo CLI](./frontend/apps/cli/README.md) organize your markdown notes locally and sync them to the Memoneo server
- [Memoneo app](./frontend/apps/app/README.md) - Android app for syncing transcribed voice notes

## Backends
- [Memoneo auth](./auth/README.md) - Handles authentication and authorization
- [Memoneo master](./master/README.md) - Wraps the Hasura GraphQL database layer
- [Memoneo gqlwrapper](./gqlwrapper/README.md) - Provides selected REST endpoints for the Memoneo app, wrapping the Hasura GraphQL API

## Demo
Recording a voice message and uploading it to the Memoneo server.

https://github.com/user-attachments/assets/b1ededbe-1e05-4094-bf4a-611a1a3ed824

Syncing the text note to your computer via the CLI.

https://github.com/user-attachments/assets/8476bb5a-9f0d-464e-b396-85a8f7285312

## Release
```bash
# Manual
gh workflow run release.yml --ref main -f tag=api@v1.0.1
gh workflow run release.yml --ref main -f tag=auth@v0.0.1
gh workflow run release.yml --ref main -f tag=cli@v0.0.1
gh workflow run release.yml --ref main -f tag=app@v1.0.1
```