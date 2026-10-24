import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import sevenZip from 'app-builder-lib/out/toolsets/7zip.js';

// Verify the actual release APK. This script does not install it on any device
// and does not claim that static package checks establish Android runtime behavior.
// Usage: node scripts/verify-android.mjs <release.apk> [Android-SDK-root]
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [apkArgument, sdkArgument] = process.argv.slice(2);
if (!apkArgument || process.argv.length > 4) {
  throw new Error('Usage: node scripts/verify-android.mjs <release.apk> [Android-SDK-root]');
}
const sdkRoot = sdkArgument || process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
if (!sdkRoot) throw new Error('Supply the Android SDK root as the second argument or ANDROID_HOME.');
const apkPath = path.resolve(apkArgument);
const sdkPath = path.resolve(sdkRoot);
const outputRoot = path.join(projectRoot, 'verification');
const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'mental-arithmetic-android-verify-'));
const runFile = promisify(execFile);
const sevenZipPath = await sevenZip.getPath7za();
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function run(executable, args) {
  const result = await runFile(executable, args, { maxBuffer: 32 * 1024 * 1024 });
  return result.stdout;
}

async function walk(root, current = root) {
  const files = [];
  for (const entry of await readdir(current, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await walk(root, absolute));
    else {
      assert.ok(entry.isFile(), `Expected a regular file: ${absolute}`);
      files.push(path.relative(root, absolute).split(path.sep).join('/'));
    }
  }
  return files.sort();
}

function parseEntries(listing) {
  const body = listing.split(/\r?\n----------\r?\n/)[1];
  assert.ok(body, 'APK ZIP member listing is available');
  return body.split(/\r?\n\r?\n/).map((record) => Object.fromEntries(
    record.split(/\r?\n/).filter((line) => line.includes(' = ')).map((line) => {
      const at = line.indexOf(' = ');
      return [line.slice(0, at), line.slice(at + 3)];
    }),
  )).filter((record) => record.Path);
}

try {
  const versions = (await readdir(path.join(sdkPath, 'build-tools'), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^\d+\.\d+\.\d+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => right.localeCompare(left, undefined, { numeric: true }));
  assert.ok(versions.length, 'At least one stable Android SDK Build Tools version is installed');
  const buildToolsVersion = versions[0];
  const toolsRoot = path.join(sdkPath, 'build-tools', buildToolsVersion);
  const windows = process.platform === 'win32';
  const aapt2Path = path.join(toolsRoot, `aapt2${windows ? '.exe' : ''}`);
  const zipalignPath = path.join(toolsRoot, `zipalign${windows ? '.exe' : ''}`);
  const apksignerPath = path.join(toolsRoot, `apksigner${windows ? '.bat' : ''}`);
  await Promise.all([aapt2Path, zipalignPath, apksignerPath].map((file) => access(file)));

  const packageInfo = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));
  const [major, minor, patch] = packageInfo.version.split('.').map(Number);
  assert.ok([major, minor, patch].every(Number.isSafeInteger), 'Shared application uses a numeric semantic version');
  const expectedVersionCode = major * 10000 + minor * 100 + patch;
  const apkBytes = await readFile(apkPath);
  const listing = await run(sevenZipPath, ['l', '-slt', apkPath]);
  const entries = parseEntries(listing);
  const entryNames = entries.map((entry) => entry.Path.replaceAll('\\', '/'));
  assert.equal(new Set(entryNames).size, entryNames.length, 'APK has no duplicate ZIP entries');
  for (const entry of entries) {
    const normalized = entry.Path.replaceAll('\\', '/');
    assert.ok(!normalized.startsWith('/') && !/^[A-Za-z]:/.test(normalized)
      && !normalized.split('/').includes('..'), `Safe APK member: ${entry.Path}`);
    assert.ok(!entry.Attributes?.includes('lrwx'), `No symbolic links in APK: ${entry.Path}`);
  }
  const crcOutput = await run(sevenZipPath, ['t', apkPath]);
  assert.match(crcOutput, /Everything is Ok/, 'All APK ZIP CRCs pass');
  await run(sevenZipPath, ['x', '-y', `-o${temporaryRoot}`, apkPath]);
  const extractedFiles = await walk(temporaryRoot);

  const badging = await run(aapt2Path, ['dump', 'badging', apkPath]);
  const packageMatch = badging.match(/^package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'/m);
  assert.ok(packageMatch, 'APK package identity is readable');
  const [, applicationId, versionCode, versionName] = packageMatch;
  const minSdk = Number(badging.match(/^(?:sdkVersion|minSdkVersion):'(\d+)'/m)?.[1]);
  const targetSdk = Number(badging.match(/^targetSdkVersion:'(\d+)'/m)?.[1]);
  const label = badging.match(/^application-label:'([^']+)'/m)?.[1];
  const launcher = badging.match(/^launchable-activity: name='([^']+)'/m)?.[1];
  const permissions = badging.split(/\r?\n/).filter((line) => /^uses-permission/.test(line));
  assert.equal(applicationId, 'local.jeff.mentalarithmetic', 'Application ID');
  assert.equal(versionName, packageInfo.version, 'APK version matches the shared application');
  assert.equal(Number(versionCode), expectedVersionCode, 'Android version code matches the shared semantic version');
  assert.equal(minSdk, 26, 'Minimum Android 8.0 / API 26');
  assert.equal(targetSdk, 37, 'Targets Android 17 / API 37');
  assert.equal(label, 'Mental Arithmetic', 'Application label');
  assert.equal(launcher, 'local.jeff.mentalarithmetic.MainActivity', 'Launcher Activity');
  assert.deepEqual(permissions, [], 'APK requests no Android permissions, including INTERNET');
  assert.ok(!/^application-debuggable/m.test(badging), 'Release application is not debuggable');
  const nativeLibraries = extractedFiles.filter((file) => /^lib\/[^/]+\//.test(file));
  assert.deepEqual(nativeLibraries, [], 'No bundled native libraries or ABI-specific runtime');
  for (const name of ['AndroidManifest.xml', 'classes.dex', 'resources.arsc', 'assets/www/index.html']) {
    assert.ok(extractedFiles.includes(name), `Required APK member: ${name}`);
  }
  const dexBytes = await readFile(path.join(temporaryRoot, 'classes.dex'));
  assert.match(dexBytes.toString('ascii', 0, 8), /^dex\n\d{3}\0$/, 'Valid Dalvik executable header');

  const expectedFrontendFiles = await walk(path.join(projectRoot, 'dist'));
  const bundledFrontendFiles = extractedFiles.filter((file) => file.startsWith('assets/www/'))
    .map((file) => file.slice('assets/www/'.length)).sort();
  assert.deepEqual(bundledFrontendFiles, expectedFrontendFiles,
    'APK frontend file set exactly matches the production dist folder');
  const frontend = [];
  for (const name of expectedFrontendFiles) {
    const source = await readFile(path.join(projectRoot, 'dist', name));
    const bundled = await readFile(path.join(temporaryRoot, 'assets/www', name));
    assert.ok(source.equals(bundled), `APK frontend matches production bytes: ${name}`);
    frontend.push({ file: name, bytes: source.length, sha256: hash(source), matches: true });
  }
  assert.ok(frontend.some((file) => file.file === 'index.html'), 'Production HTML is bundled');
  assert.ok(frontend.some((file) => file.file.endsWith('.js')), 'Production JavaScript is bundled');
  assert.ok(frontend.some((file) => file.file.endsWith('.css')), 'Production CSS is bundled');

  const alignmentOutput = await run(zipalignPath, ['-c', '-P', '16', '-v', '4', apkPath]);
  assert.match(alignmentOutput, /Verification successful/, 'APK ZIP alignment verification passes');
  const signatureOutput = await run(apksignerPath, ['verify', '--verbose', '--print-certs', apkPath]);
  assert.match(signatureOutput, /^Verifies\s*$/m, 'APK signature verifies');
  const signatureSchemes = Object.fromEntries([...signatureOutput.matchAll(
    /^Verified using (v[\d.]+) scheme[^:]*: (true|false)$/gm,
  )].map((match) => [match[1], match[2] === 'true']));
  assert.ok(signatureSchemes.v2 || signatureSchemes.v3 || signatureSchemes['v3.1'],
    'APK uses a modern whole-APK signature');
  const signerSha256 = signatureOutput.match(/^(?:Signer #1|V[\d.]+ Signer):? certificate SHA-256 digest: (.+)$/m)?.[1];
  assert.ok(signerSha256, 'Signing certificate SHA-256 is recorded');

  const report = {
    verifiedAt: new Date().toISOString(),
    version: versionName,
    verificationHost: { platform: process.platform, architecture: process.arch },
    sdkBuildTools: buildToolsVersion,
    apk: { path: apkPath, bytes: apkBytes.length, sha256: hash(apkBytes),
      entryCount: entries.length, crcPassed: true, zipAlignmentPassed: true },
    manifest: { applicationId, versionName, versionCode: Number(versionCode), label,
      minSdk, targetSdk, launcher, permissions, debuggable: false },
    signature: { verified: true, schemes: signatureSchemes, signerSha256 },
    nativeLibraries,
    architecture: 'Universal APK; uses the installed Android System WebView; no bundled native libraries',
    frontend,
    runtimeExecution: { performed: false,
      reason: 'This verifier inspects package bytes only. Separate emulator/device evidence is required for runtime claims.' },
  };
  await mkdir(outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, 'android-artifacts.json'), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(path.join(outputRoot, 'android-package-verification.txt'),
    `APK ZIP CRC verification\n${crcOutput}\nAPK metadata\n${badging}\nZIP alignment\n${alignmentOutput}\nAPK signature\n${signatureOutput}`);
  console.log(`Android ${versionName}: API ${minSdk} minimum / API ${targetSdk} target, ${entries.length} CRC-checked APK members, verified signature and ZIP alignment.`);
  console.log(`All ${frontend.length} production frontend files match the APK byte-for-byte. No Android permissions or native ABI libraries are bundled.`);
  console.log('This package verification does not install or execute the APK.');
  console.log(path.join(outputRoot, 'android-artifacts.json'));
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
