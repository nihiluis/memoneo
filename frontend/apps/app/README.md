# Memoneo app
Basic Android app for recording voice messages and sending the transcripts as a note to the self-hosted Memoneo server.

Web and Ios frontends are currently not supported.

The app is built with Expo, React Native, Nativewind (Tailwind for React Native) and react-native-reusables (shadcn for React Native).

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
