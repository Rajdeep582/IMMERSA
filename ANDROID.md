# Immersa — Android app (Capacitor)

The Android app is an extra build target. It does not replace the website. Both come from the same `src/` and `public/` folders.

| Target | Command | Output | Notes |
|---|---|---|---|
| Website | `npm run build` | `dist/` | Unchanged: Google Fonts, service worker cache |
| Android web bundle | `npm run build:android` | `dist-android/` → copied into `android/` | Fonts bundled locally (works offline), no service worker, native back button |
| Signed APK | `npm run android:apk` | `release/Immersa-<version>.apk` + `release/Immersa-latest.apk` | Release build, signed with `keystore/` |
| Debug APK | `npm run android:apk:debug` | `release/Immersa-<version>-debug.apk` | Debug signing |
| Android Studio | `npm run android:open` | — | Opens the native project |

## One-time setup (Windows)

1. Install **Android Studio**. It installs the Android SDK and a bundled JDK. The build script finds both automatically (`%LOCALAPPDATA%\Android\Sdk` and `C:\Program Files\Android\Android Studio\jbr`). Otherwise, set `ANDROID_HOME` and `JAVA_HOME` (JDK 21).
2. In Android Studio, open SDK Manager and make sure **Android SDK Platform 36** and **Build-Tools 36** are installed.
3. `npm install` (the Capacitor packages are already in `package.json`).

## Updating the APK after changing the web app

```
npm run android:apk
```

That one command does all of this:
- type-checks the code;
- builds `dist-android/`;
- runs `npx cap sync android`;
- runs Gradle `assembleRelease`;
- copies the signed APK to `release/`.

The versionName comes from `package.json` → `version`; bump it for a visible version change. The versionCode increases automatically on every build, so a new APK installs over the old one and the user's app data is kept.

## Distributing the APK

- Send `release/Immersa-latest.apk` (Drive, WhatsApp, a USB copy, or your website).
- On the phone, open the APK and allow "Install unknown apps" for the app that opened it.
- To install over USB: `adb install -r release/Immersa-latest.apk`.

## Signing key — IMPORTANT

`keystore/immersa-release.jks` and `keystore/keystore.properties` hold the release key and its passwords.

- **Back up the `keystore/` folder** somewhere private.
- **Never commit or share it.** It is already in `.gitignore`.
- If the key is lost, phones that already have the app **cannot update it**. Users would have to uninstall the app (losing its data) before a build signed with a new key can be installed.
- If the folder is missing, the script builds an unsigned release APK, which cannot be installed.

## App details

| Item | Value |
|---|---|
| App id | `com.immersa.anatomy` |
| Min Android | 10 (API 29) |
| Target / compile SDK | 36 |
| WebView | Android System WebView 100 or newer. Older versions show an update prompt. WebGL2 + ES2022 are required |
| Size | ≈ 75 MB APK. All models and data are bundled, so it works fully offline |
| Permissions | INTERNET only (no other permissions) |

## Android-specific behaviour

- **Back button:** closes the Learn page → guided journey → slice dock → isolate → selection, in that order. With nothing open, it minimises the app rather than closing it, so the loaded meshes are kept.
- **Font size:** Android's system font-scale setting is ignored (`textZoom 100`), so the layout is the same as on the web.
- **Zoom:** page zoom is disabled. Pinch goes to the 3D camera.
- **Rendering:** hardware-accelerated window, and the WebView renderer runs at foreground priority while the app is visible. The same adaptive quality engine as the web is used: device tiers, sharp image at rest, merged draw calls, parallel shader compile and worker-based mesh decoding.
- **Screen edges:** edge-to-edge with system-bar insets passed to the existing `env(safe-area-inset-*)` CSS (`SystemBars.insetsHandling = native`).
- **Tablets:** resizable activity (split screen / multi-window), all orientations.
