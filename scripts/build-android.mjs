import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const projectParent = path.dirname(projectRoot);
const workspaceRoot = path.basename(projectParent) === 'outputs' ? path.dirname(projectParent) : projectParent;
const androidRoot = path.join(projectRoot, 'android');
const includeTests = process.argv.includes('--tests');
const unknownOptions = process.argv.slice(2).filter((value) => value !== '--tests');
if (unknownOptions.length) throw new Error(`Unknown Android build option: ${unknownOptions.join(', ')}`);

async function exists(file) {
  try { await fs.access(file); return true; } catch { return false; }
}

async function readOptionalJson(file) {
  if (!await exists(file)) return {};
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

const localPaths = await readOptionalJson(path.join(workspaceRoot, 'work/android-toolchain/paths.json'));
const javaHome = process.env.JAVA_HOME || localPaths.javaHome;
const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || localPaths.androidHome;
const gradleBin = process.env.MENTAL_ARITHMETIC_GRADLE_BIN || localPaths.gradleBin
  || path.join(androidRoot, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
const gradleUserHome = process.env.GRADLE_USER_HOME || localPaths.gradleUserHome;
const executableSuffix = process.platform === 'win32' ? '.exe' : '';
const keytool = javaHome ? path.join(javaHome, 'bin', `keytool${executableSuffix}`) : `keytool${executableSuffix}`;
const environment = { ...process.env };
if (javaHome) environment.JAVA_HOME = javaHome;
if (androidHome) {
  environment.ANDROID_HOME = androidHome;
  environment.ANDROID_SDK_ROOT = androidHome;
}
if (gradleUserHome) environment.GRADLE_USER_HOME = gradleUserHome;

async function run(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    // Gradle's Windows wrapper is a command file. All other commands execute
    // directly, and no signing password is ever passed in a command argument.
    const isWindowsCommandFile = process.platform === 'win32' && /\.(bat|cmd)$/i.test(command);
    const child = spawn(isWindowsCommandFile ? `"${command}"` : command, args, {
      cwd: androidRoot, env: environment, stdio: 'inherit',
      shell: isWindowsCommandFile,
      ...options,
    });
    child.once('error', reject);
    child.once('close', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(command)} failed (${signal || code}).`));
    });
  });
}

const signingVariables = [
  'MENTAL_ARITHMETIC_KEYSTORE', 'MENTAL_ARITHMETIC_STORE_PASSWORD',
  'MENTAL_ARITHMETIC_KEY_ALIAS', 'MENTAL_ARITHMETIC_KEY_PASSWORD',
];
const suppliedSigningValues = signingVariables.filter((name) => Boolean(process.env[name]));
let signingMode = 'provided-private-keystore';
if (suppliedSigningValues.length && suppliedSigningValues.length !== signingVariables.length) {
  throw new Error(`Supply all four release signing environment variables together: ${signingVariables.join(', ')}.`);
}
if (!suppliedSigningValues.length) {
  signingMode = 'persistent-local-release-keystore';
  const signingDirectory = path.resolve(process.env.MENTAL_ARITHMETIC_SIGNING_DIR
    || path.join(workspaceRoot, 'work/android-signing'));
  const keystore = path.join(signingDirectory, 'mental-arithmetic.p12');
  const passwordFile = path.join(signingDirectory, 'keystore-password.txt');
  await fs.mkdir(signingDirectory, { recursive: true, mode: 0o700 });
  const hasKeystore = await exists(keystore);
  const hasPassword = await exists(passwordFile);
  if (hasKeystore && !hasPassword) {
    throw new Error('The existing Android signing key has no password file. Restore its original password or supply all four signing environment variables; the key will not be replaced.');
  }
  if (!hasPassword) await fs.writeFile(passwordFile, randomBytes(32).toString('base64') + '\n', { mode: 0o600, flag: 'wx' });
  if (!hasKeystore) {
    await run(keytool, [
      '-genkeypair', '-noprompt', '-storetype', 'PKCS12', '-keystore', keystore,
      '-storepass:file', passwordFile, '-keypass:file', passwordFile,
      '-alias', 'mental-arithmetic', '-keyalg', 'RSA', '-keysize', '3072', '-validity', '10000',
      '-dname', 'CN=Mental Arithmetic Local Android Release, OU=Local Applications',
    ]);
    await fs.chmod(keystore, 0o600);
  }
  const password = (await fs.readFile(passwordFile, 'utf8')).trim();
  if (!password) throw new Error('The Android signing password file is empty. Restore it before rebuilding.');
  environment.MENTAL_ARITHMETIC_KEYSTORE = keystore;
  environment.MENTAL_ARITHMETIC_STORE_PASSWORD = password;
  environment.MENTAL_ARITHMETIC_KEY_ALIAS = 'mental-arithmetic';
  environment.MENTAL_ARITHMETIC_KEY_PASSWORD = password;
} else {
  environment.MENTAL_ARITHMETIC_KEYSTORE = path.resolve(environment.MENTAL_ARITHMETIC_KEYSTORE);
  if (!await exists(environment.MENTAL_ARITHMETIC_KEYSTORE)) throw new Error('The supplied Android release keystore does not exist.');
}

if (!await exists(path.join(projectRoot, 'dist/index.html'))) {
  throw new Error('The production frontend is missing. Run npm run build before the Android build.');
}
console.log('Building the offline Android release and running Android lint.');
const tasks = [':app:assembleRelease', ':app:lintRelease'];
if (includeTests) tasks.push(':app:assembleReleaseAndroidTest');
await run(gradleBin, [...tasks, '--no-daemon', '--console=plain']);

const packageInfo = JSON.parse(await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8'));
const builtApk = path.join(androidRoot, 'app/build/outputs/apk/release/app-release.apk');
if (!await exists(builtApk)) throw new Error('Gradle did not produce the expected signed release APK.');
const releaseDirectory = path.join(projectRoot, 'release');
await fs.mkdir(releaseDirectory, { recursive: true });
const artifact = path.join(releaseDirectory, `Mental-Arithmetic-${packageInfo.version}-Android.apk`);
await fs.copyFile(builtApk, artifact);
const testApk = path.join(androidRoot, 'app/build/outputs/apk/androidTest/release/app-release-androidTest.apk');
const metadata = {
  createdAt: new Date().toISOString(),
  applicationId: 'local.jeff.mentalarithmetic',
  version: packageInfo.version,
  minSdk: 26,
  targetSdk: 37,
  compileSdk: 37,
  signingMode,
  keystorePath: environment.MENTAL_ARITHMETIC_KEYSTORE,
  javaHome: javaHome || null,
  androidHome: androidHome || null,
  gradleBin,
  artifact,
  builtApk,
  testApk: includeTests && await exists(testApk) ? testApk : null,
};
await fs.mkdir(path.join(projectRoot, 'verification'), { recursive: true });
for (const extension of ['txt', 'xml', 'html']) {
  const lintReport = path.join(androidRoot, `app/build/reports/lint-results-release.${extension}`);
  if (await exists(lintReport)) {
    await fs.copyFile(lintReport, path.join(projectRoot, `verification/android-lint-results.${extension}`));
  }
}
await fs.writeFile(path.join(projectRoot, 'verification/android-build-location.json'), JSON.stringify(metadata, null, 2) + '\n');
console.log(`Android APK: ${artifact}`);
