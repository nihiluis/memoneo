# Memoneo CLI
Command line interface for syncing your markdown notes to the Memoneo server, built with oclif.

## Getting started
To use the CLI, you currently need to build it from source with your own configuration params.

```bash
pnpm run build
```

### Standalone binary
`pnpm run build:binary` bundles the CLI with esbuild (`scripts/bundle.mjs`) and packs it with pkg into `dist-bin/` for Linux, macOS and Windows. `pnpm run build:binary:macos-arm64` builds only the Apple Silicon binary. macOS binaries are only signed when built on macOS; unsigned ones are refused by Apple Silicon Macs.

Commands are registered in `src/commands.ts` (oclif explicit discovery); add new commands there.

### Build options
The CLI reads `config.json` from your working directory, then falls back to the `config.json` next to the package, then to the defaults. The CLI creates a default one in your working directory if none exists. The default configuration looks like:

```json
{
  "baseDirectory": "_testdata",
  "defaultDirectory": "_unassigned",
  "basePath": {
    "dev": "/",
    "prod": "/web"
  },
  "productName": "Memoneo",
  "authApiUrl": {
    "dev": "http://localhost:8089",
    "prod": "https://your.prod.instance.com"
  },
  "apiUrl": {
    "dev": "http://localhost:8094",
    "prod": "https://your.prod.instance.com"
  }
}
```

## Commands
Note: if you build the CLI from source, you will have to set up the executable (provided by Oclif in ./bin/run.js).

Alternatively, you can run ./bin/dev.js <command> to test the commands without building.

### Init
Initialize Memoneo in the current directory and connect to the Memoneo server.

```bash
memoneo init [--mail=<email>] [--password=<password>]
```

Options:
- `-m, --mail` - Your email address
- `-p, --password` - Your password

### Download
Download notes from remote.

```bash
memoneo download
```

### Upload
Upload new notes to remote.

```bash
memoneo upload [--dir=<directory>]
```

Options:
- `--dir` - The target directory that is recursively searched for md files (optional)

### Sync
Synchronize notes between local and remote.

```bash
memoneo sync [--dir=<directory>]
```

Options:
- `--dir` - The target directory that is recursively searched for md files (optional)

### Delete
Delete notes from remote that no longer exist locally.

```bash
memoneo delete [--dir=<directory>]
```

Options:
- `--dir` - The target directory that is recursively searched for md files (optional)

### Password
Change your password.

```bash
memoneo password
```

## Internal Files

The CLI stores internal files in a `.memoneo` directory:
- `token` - Authentication token
- `key` - Encryption key
- `config.json` - Internal configuration
- `cache.json` - File cache for tracking note changes
