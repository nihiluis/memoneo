# Android UI testing

Use `agent-device` for visual Android emulator checks.

## Setup

Requirements: Node 22+, Android SDK/ADB, and an Android emulator.

```bash
npm install -g agent-device@0.20.10
agent-device doctor --platform android
agent-device boot --platform android --device memoneo_pixel_8_api_36
```

## Run a smoke test

```bash
cd frontend/apps/app
pnpm android

agent-device open com.anonymous.memoneo --platform android
agent-device snapshot -i
agent-device screenshot ./ui-evidence.png --platform android
agent-device close
```

Use the refs from `snapshot -i` to tap or fill controls, then take another snapshot or screenshot to verify the result.

## Long-note editor regression

To verify the disappearing-text fix:

1. Focus the note body from `snapshot -i`.
2. Fill it with at least 40 newline-separated lines and capture a screenshot.
   Confirm that the visible scrolled portion still contains text.
3. Replace the line breaks with spaces and capture another screenshot. Confirm
   that the long paragraph remains visible.
4. With the body focused, type two actual line breaks and some text. Confirm
   that both the inserted text and the surrounding text remain visible.

Leave the test draft unsaved unless persistence is part of the test.

## Troubleshooting

### ADB cannot start

ADB uses a client/server setup. The client starts a local background server that
listens on TCP port `5037`. If you see:

```text
could not install *smartsocket* listener: Operation not permitted
```

the local shell was blocked from opening that listening socket. This is a host
permission problem, not an Android emulator or app crash. Run the ADB and
`agent-device` commands with host-level permissions (or from a normal host
terminal), then confirm the connection:

```bash
agent-device doctor --platform android --debug
adb devices -l
```

If `agent-device` reports that its daemon cannot write under
`~/.agent-device`, the same host-level permission issue is preventing its local
daemon from writing its state and log files.

### Multiple Android targets

When both a physical device and an emulator are connected, Expo may install the
debug APK on a different target than the one selected by `agent-device`. Check
both targets and verify the package has the `DEBUGGABLE` flag before opening it:

```bash
agent-device devices
adb devices -l
adb -s <serial> shell dumpsys package com.anonymous.memoneo
```

If needed, install the generated debug APK on the selected target explicitly:

```bash
adb -s <serial> install -r android/app/build/outputs/apk/debug/app-debug.apk
```

For an Android emulator, use `--metro-host 10.0.2.2`; a physical device needs
the host machine's LAN address instead.
