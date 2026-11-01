#!/usr/bin/env node
/**
 * One-command Android APK build: web bundle (android mode) → Capacitor sync → signed release APK.
 *
 *   npm run android:apk            signed release APK  → release/Immersa-<version>.apk
 *   npm run android:apk -- --debug debug APK (installs alongside nothing; same app id)
 *
 * The website build (`npm run build` → dist/) is never touched; the app bundle goes to dist-android/.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import os from 'node:os';

const root = resolve(import.meta.dirname, '..');
const android = join(root, 'android');
const win = process.platform === 'win32';
const debug = process.argv.includes('--debug');

function run(cmd, args, cwd = root, env = process.env) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd, env, stdio: 'inherit', shell: win });
  if (r.status !== 0) {
    console.error(`\n✖ ${cmd} failed (exit ${r.status ?? r.signal})`);
    process.exit(r.status ?? 1);
  }
}

// ---- Android SDK + JDK discovery (Android Studio defaults on Windows / macOS / Linux) ----
const env = { ...process.env };
const sdkCandidates = [
  env.ANDROID_HOME,
  env.ANDROID_SDK_ROOT,
  win && env.LOCALAPPDATA && join(env.LOCALAPPDATA, 'Android', 'Sdk'),
  process.platform === 'darwin' && join(os.homedir(), 'Library', 'Android', 'sdk'),
  join(os.homedir(), 'Android', 'Sdk'),
  '/opt/android-sdk',
].filter(Boolean);
const localProps = join(android, 'local.properties');
if (!existsSync(localProps)) {
  const sdk = sdkCandidates.find((p) => existsSync(p));
  if (!sdk) {
    console.error('✖ Android SDK not found. Install Android Studio (it installs the SDK) or set ANDROID_HOME.');
    process.exit(1);
  }
  writeFileSync(localProps, `sdk.dir=${sdk.replace(/\\/g, '\\\\').replace(/:/g, '\\:')}\n`);
  console.log(`• Android SDK: ${sdk}`);
}
if (!env.JAVA_HOME) {
  const jbr = [
    win && 'C:\\Program Files\\Android\\Android Studio\\jbr',
    process.platform === 'darwin' && '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
    '/opt/android-studio/jbr',
  ].filter(Boolean).find((p) => existsSync(p));
  if (jbr) {
    env.JAVA_HOME = jbr;
    console.log(`• JDK: ${jbr} (Android Studio bundled)`);
  }
}

// ---- Version: name from package.json, code strictly increasing (minutes since 2026-01-01) ----
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const versionName = pkg.version;
const versionCode = Math.floor((Date.now() - Date.UTC(2026, 0, 1)) / 60000);

const signed = existsSync(join(root, 'keystore', 'keystore.properties'));
if (!debug && !signed) console.warn('⚠ keystore/keystore.properties missing → release APK will be UNSIGNED (not installable).');

// ---- Build ----
run('npx', ['tsc', '-b']);
run('npx', ['vite', 'build', '--mode', 'android']);
run('npx', ['cap', 'sync', 'android']);
const gradlew = win ? 'gradlew.bat' : './gradlew';
run(gradlew, [debug ? 'assembleDebug' : 'assembleRelease', `-PappVersionName=${versionName}`, `-PappVersionCode=${versionCode}`, '--console=plain'], android, env);

// ---- Collect ----
const variant = debug ? 'debug' : 'release';
const outDir = join(android, 'app', 'build', 'outputs', 'apk', variant);
const built = join(outDir, debug ? 'app-debug.apk' : signed ? 'app-release.apk' : 'app-release-unsigned.apk');
if (!existsSync(built)) {
  console.error(`✖ APK not found at ${built}`);
  process.exit(1);
}
const rel = join(root, 'release');
mkdirSync(rel, { recursive: true });
const name = `Immersa-${versionName}${debug ? '-debug' : ''}.apk`;
copyFileSync(built, join(rel, name));
copyFileSync(built, join(rel, debug ? 'Immersa-latest-debug.apk' : 'Immersa-latest.apk'));
console.log(`\n✔ ${variant} APK  v${versionName} (code ${versionCode})\n  release/${name}\n  release/${debug ? 'Immersa-latest-debug.apk' : 'Immersa-latest.apk'}`);
