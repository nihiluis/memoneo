# Memoneo app
Memoneo supports Android and web for local markdown notes, encrypted sync, and transcribed voice notes.

The iOS frontend is currently not supported.

The app is built with Expo, React Native, Uniwind (Tailwind for React Native) and react-native-reusables (shadcn for React Native).

## Setup
### Prerequisites
- Node/NPM
- Expo CLI
- Android Studio for the enckey Android-specific module
- Memoneo auth and api services (from this repo)
- [Transcription API](https://github.com/nihiluis/transcription-api)

The API urls must be set in the .env.local file
```bash
EXPO_PUBLIC_AUTH_BASE_URL=http://api.yoururl.com
EXPO_PUBLIC_API_BASE_URL=http://api.yoururl.com
EXPO_PUBLIC_TRANSCRIBE_BASE_URL=http://api.yoururl.com
```

## Development
```bash
# Start locally
npx expo start
# Start locally and clear cache (sometimes necessary)
npx expo start --clear
# Run on Android
npx expo run:android
```

## Web

From `frontend`, run:

```sh
pnpm app web
# Production export
pnpm build:app:web
```

The production export is written to `frontend/apps/app/dist`. Serve it as a static
single-page application and rewrite unmatched routes (including `/records/:id`)
to `index.html`. Use HTTPS in production; microphone access and Web Crypto require
HTTPS or localhost. Set the same three `EXPO_PUBLIC_*_BASE_URL` values before
building. Each service must allow the web origin through CORS, or be served behind
a reverse proxy on the same origin. Auth requests include credentials.

On desktop, the folder tree stays visible beside the editor. Smaller windows use
the drawer. Notes and folders are saved locally in IndexedDB and share Android's
upload/download/sync behavior. Use the note's options button for individual sync
and deletion. `Ctrl/Cmd+S` saves the current note; `Ctrl/Cmd+B` toggles bold.
The drawer also offers markdown import and export of the selected saved note.
Imports create new local notes rather than retaining another file's remote ID.

Voice recordings are stored as audio blobs in IndexedDB. Open Voice recordings to
record, pause/resume, play back, download audio, transcribe, and save a transcript
as a local note. Browser audio formats vary (WebM/Opus, MP4, or Ogg); the transcription
service must accept the format produced by the browser. Sync the resulting note
using the normal note actions.

The browser encryption adapter supports both legacy and v2 password-protected
keys and the existing AES-GCM note format. The auth token and a non-exportable
Web Crypto key are saved together in IndexedDB, scoped to the configured backend
URLs. Reloading a page restores the key before verifying and refreshing the
session. No password or raw encryption key bytes are saved. Signing out or
clearing the session deletes both the saved token and key; expired sessions are
removed on restore. The browser remains unlocked between visits until sign-out
or session expiry. If browser storage is unavailable, login works in memory and
a reload requires signing in again. Local notes and recordings remain available
across reloads independently of login.

Offline note editing works while the app is loaded. A service worker and
installable PWA support are not included.

Browser-specific implementations use `.web.ts` / `.web.tsx` files. Android keeps
its filesystem, secure token storage, and native key store. Tests exercise
IndexedDB persistence, recording metadata, multipart uploads, compatible sync hashes, and AES-GCM/key
compatibility using independently generated Node crypto fixtures.
