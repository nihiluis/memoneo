---
name: android-ui-testing
description: Use agent-device to test this repository's Android app on emulators or connected devices, including setup, accessibility-driven interaction, screenshots, and diagnosis of ADB or dev-client connection issues.
---

# Android Ui Testing

Use this skill when a user asks to manually verify Android UI behavior or reproduce a visual or interaction bug in this repository's Android app.

## Workflow

1. Read [`frontend/apps/app/UI_TESTING.md`](../../../frontend/apps/app/UI_TESTING.md)
   before testing.
2. If `agent-device` is unavailable, install the pinned tool version with
   `npm install -g agent-device@0.20.10`.
3. Check the toolchain with `agent-device doctor --platform android --debug`.
   Boot the configured emulator if needed, then run
   `agent-device open <package> --platform android --foreground`.
4. Use `snapshot -i` and the returned refs for interaction. Prefer `fill` for
   replacing a field, `type` for appending, and `press`/`scroll` for actions.
   After mutations, use `--settle` and verify the changed state with the diff.
5. Capture and inspect a screenshot when the result is layout-sensitive. Test
   the user's exact reproduction path and its recovery path.
6. Finish with `agent-device close`. Do not save or submit test data unless the
   user explicitly asks for that.

For long-note editor bugs, fill at least 40 newline-separated lines, verify the
scrolled screenshot, replace the breaks with spaces and verify again, then type
actual breaks into the focused field and verify the inserted and surrounding
text.

## Device and dev-client details

When more than one Android target is connected, run `agent-device devices` and
`adb devices -l`. Expo can install a debug APK on a different target than the
one selected by `agent-device`; verify the selected package with:

```bash
adb -s <serial> shell dumpsys package <package>
```

The package output must include `DEBUGGABLE` when the app is opened through the
React Native development client. If necessary, install the built debug APK on
the selected target:

```bash
adb -s <serial> install -r android/app/build/outputs/apk/debug/app-debug.apk
```

For an Android emulator, use `--metro-host 10.0.2.2`; a physical device needs
the host machine's LAN address.

## Troubleshooting ADB and agent-device

ADB has a client/server architecture. The client starts a local background ADB
server listening on TCP port `5037`. If it reports:

```text
could not install *smartsocket* listener: Operation not permitted
```

the shell was blocked from opening that local listening socket. This is a host
permission problem, not an emulator or app crash. Retry the ADB and
`agent-device` commands with host-level permissions or from a normal host
terminal, then confirm:

```bash
agent-device doctor --platform android --debug
adb devices -l
```

If `agent-device` says its daemon cannot write under `~/.agent-device`, the
same restricted environment is preventing its local state/log files from being
written. Resolve that host filesystem permission issue before debugging the
app itself.

If Gradle reports `Unsupported class file major version 69`, the active JDK is
Java 25 while this project's Gradle/Groovy toolchain needs an older runtime.
Retry with an installed Java 21 JDK, for example on macOS:

```bash
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home pnpm android
```
