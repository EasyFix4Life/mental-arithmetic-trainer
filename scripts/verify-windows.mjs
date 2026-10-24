import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, stat, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import asar from '@electron/asar';
import sevenZip from 'app-builder-lib/out/toolsets/7zip.js';

// This verifies real release bytes without claiming to run Windows on another OS.
// Usage: node scripts/verify-windows.mjs path/to/app.zip path/to/Setup.exe
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [zipArgument, setupArgument] = process.argv.slice(2);
if (!zipArgument || !setupArgument || process.argv.length !== 4) {
  throw new Error('Usage: node scripts/verify-windows.mjs <Windows-app.zip> <Windows-Setup.exe>');
}
const zipPath = path.resolve(zipArgument);
const setupPath = path.resolve(setupArgument);
const outputRoot = path.join(projectRoot, 'verification');
const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'mental-arithmetic-windows-verify-'));
const run = promisify(execFile);
const sevenZipPath = await sevenZip.getPath7za();
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function command(arguments_) {
  const result = await run(sevenZipPath, arguments_, { maxBuffer: 32 * 1024 * 1024 });
  return result.stdout;
}

async function archiveEntries(archive) {
  const listing = await command(['l', '-slt', archive]);
  const body = listing.split(/\r?\n----------\r?\n/)[1];
  assert.ok(body, `Cannot read archive listing: ${archive}`);
  return body.split(/\r?\n\r?\n/).map((record) => {
    const fields = Object.fromEntries(record.split(/\r?\n/).filter((line) => line.includes(' = '))
      .map((line) => [line.slice(0, line.indexOf(' = ')), line.slice(line.indexOf(' = ') + 3)]));
    return fields;
  }).filter((record) => record.Path);
}

async function extractChecked(archive, destination) {
  const entries = await archiveEntries(archive);
  for (const entry of entries) {
    const normalized = entry.Path.replaceAll('\\', '/');
    assert.ok(!normalized.startsWith('/') && !/^[A-Za-z]:/.test(normalized)
      && !normalized.split('/').includes('..'), `Unsafe archive member: ${entry.Path}`);
    assert.ok(!entry.Attributes?.includes('lrwx'), `Unexpected symbolic link: ${entry.Path}`);
  }
  const crcOutput = await command(['t', archive]);
  assert.match(crcOutput, /Everything is Ok/, `Archive integrity did not pass: ${archive}`);
  await command(['x', '-y', `-o${destination}`, archive]);
  return { entries, crcOutput };
}

async function walk(root, directory = root) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(root, absolute));
    else if (entry.isFile()) files.push(path.relative(root, absolute).split(path.sep).join('/'));
    else throw new Error(`Unexpected non-regular file: ${absolute}`);
  }
  return files.sort();
}

async function peInfo(file) {
  const bytes = await readFile(file);
  assert.equal(bytes.toString('ascii', 0, 2), 'MZ', `${file}: DOS executable header`);
  assert.ok(bytes.length >= 64, `${file}: PE header length`);
  const peOffset = bytes.readUInt32LE(0x3c);
  assert.ok(peOffset + 26 < bytes.length, `${file}: valid PE offset`);
  assert.equal(bytes.toString('ascii', peOffset, peOffset + 4), 'PE\0\0', `${file}: PE signature`);
  const machine = bytes.readUInt16LE(peOffset + 4);
  const optionalMagic = bytes.readUInt16LE(peOffset + 24);
  const optionalStart = peOffset + 24;
  const dataDirectory = optionalStart + (optionalMagic === 0x20b ? 112 : 96);
  const signatureOffset = bytes.readUInt32LE(dataDirectory + 4 * 8);
  const signatureLength = bytes.readUInt32LE(dataDirectory + 4 * 8 + 4);
  return {
    machine: `0x${machine.toString(16)}`,
    architecture: machine === 0x8664 ? 'x64' : machine === 0x14c ? 'ia32' : 'other',
    format: optionalMagic === 0x20b ? 'PE32+' : optionalMagic === 0x10b ? 'PE32' : 'other',
    authenticodeTablePresent: signatureOffset > 0 && signatureLength > 0,
    size: bytes.length,
    sha256: digest(bytes),
  };
}

try {
  const packageInfo = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));
  const zipRoot = path.join(temporaryRoot, 'zip');
  const zipCheck = await extractChecked(zipPath, zipRoot);
  const zipFiles = await walk(zipRoot);
  const executableMembers = zipFiles.filter((file) => file.endsWith('Mental Arithmetic.exe'));
  assert.equal(executableMembers.length, 1, 'Exactly one main application executable in ZIP');
  const applicationRoot = path.dirname(path.join(zipRoot, executableMembers[0]));
  const applicationFiles = await walk(applicationRoot);
  const required = [
    'Mental Arithmetic.exe', 'resources/app.asar',
    'chrome_100_percent.pak', 'chrome_200_percent.pak',
    'd3dcompiler_47.dll', 'dxcompiler.dll', 'electron_wer.dll', 'ffmpeg.dll',
    'icudtl.dat', 'resources.pak',
    'snapshot_blob.bin', 'v8_context_snapshot.bin',
    'vk_swiftshader.dll', 'vk_swiftshader_icd.json', 'vulkan-1.dll',
    'locales/en-US.pak', 'LICENSE.electron.txt', 'LICENSES.chromium.html',
  ];
  for (const name of required) {
    assert.ok(applicationFiles.includes(name), `Required application/runtime file: ${name}`);
    assert.ok((await stat(path.join(applicationRoot, name))).size > 0, `Nonempty file: ${name}`);
  }
  assert.ok(applicationFiles.filter((file) => /^locales\/.*\.pak$/.test(file)).length > 1,
    'Runtime includes its locale resource directory');

  const peFiles = [];
  for (const file of applicationFiles.filter((file) => /\.(exe|dll)$/i.test(file))) {
    const result = await peInfo(path.join(applicationRoot, file));
    assert.equal(result.architecture, 'x64', `${file}: shipped runtime must be AMD64`);
    assert.equal(result.format, 'PE32+', `${file}: shipped runtime must be PE32+`);
    peFiles.push({ file, ...result });
  }

  const asarPath = path.join(applicationRoot, 'resources/app.asar');
  const bundledPackage = JSON.parse(asar.extractFile(asarPath, 'package.json').toString('utf8'));
  assert.equal(bundledPackage.version, packageInfo.version, 'Packaged application version');
  assert.equal(bundledPackage.main, 'desktop/main.cjs', 'Packaged entry point');
  const frontendFiles = await walk(path.join(projectRoot, 'dist'));
  const frontend = [];
  const shell = [];
  for (const file of [...frontendFiles.map((name) => `dist/${name}`), 'desktop/main.cjs', 'desktop/security.cjs']) {
    const source = await readFile(path.join(projectRoot, file));
    const bundled = asar.extractFile(asarPath, file);
    assert.ok(source.equals(bundled), `Packaged source mismatch: ${file}`);
    (file.startsWith('dist/') ? frontend : shell).push({ file, bytes: source.length, sha256: digest(source), matches: true });
  }
  assert.ok(frontend.some((file) => file.file === 'dist/index.html'), 'Production index is bundled');
  assert.ok(frontend.some((file) => file.file.endsWith('.js')), 'Production JavaScript is bundled');
  assert.ok(frontend.some((file) => file.file.endsWith('.css')), 'Production CSS is bundled');

  const setupBytes = await readFile(setupPath);
  const setupPe = await peInfo(setupPath);
  assert.ok(['ia32', 'x64'].includes(setupPe.architecture), 'Valid Windows installer PE architecture');
  assert.ok(setupBytes.includes(Buffer.from('NullsoftInst')), 'NSIS installer signature');
  // NSIS uses a small 32-bit installer stub for a 64-bit application. Inspect the
  // embedded app archive to establish its actual architecture and completeness.
  const installerRoot = path.join(temporaryRoot, 'installer');
  const installerCheck = await extractChecked(setupPath, installerRoot);
  const installerFiles = await walk(installerRoot);
  const payloadArchives = installerFiles.filter((file) => /app-64\.7z$/i.test(file));
  assert.equal(payloadArchives.length, 1, 'NSIS includes one offline x64 application payload');
  const payloadRoot = path.join(temporaryRoot, 'payload');
  const payloadCheck = await extractChecked(path.join(installerRoot, payloadArchives[0]), payloadRoot);
  const payloadFiles = await walk(payloadRoot);
  // electron-builder adds its installer elevation helper only to the NSIS
  // payload. It is not needed by the separately extracted application ZIP.
  const installerOnlyFiles = payloadFiles.filter((file) => !applicationFiles.includes(file));
  assert.ok(installerOnlyFiles.every((file) => file === 'resources/elevate.exe'),
    'Only the known NSIS elevation helper may be absent from the application ZIP');
  assert.deepEqual(payloadFiles.filter((file) => !installerOnlyFiles.includes(file)), applicationFiles,
    'Every application/runtime ZIP member is present in the installer payload');
  const installerHelpers = [];
  for (const file of installerOnlyFiles) {
    const info = await peInfo(path.join(payloadRoot, file));
    assert.ok(['ia32', 'x64'].includes(info.architecture), 'Valid NSIS elevation helper PE architecture');
    installerHelpers.push({ file, ...info });
  }
  const payloadComparisons = [];
  for (const file of applicationFiles) {
    const zipBytes = await readFile(path.join(applicationRoot, file));
    const installerBytes = await readFile(path.join(payloadRoot, file));
    assert.ok(zipBytes.equals(installerBytes), `Installer/ZIP payload mismatch: ${file}`);
    payloadComparisons.push({ file, bytes: zipBytes.length, sha256: digest(zipBytes), matches: true });
  }
  const zipBytes = await readFile(zipPath);
  const report = {
    verifiedAt: new Date().toISOString(),
    version: packageInfo.version,
    target: 'Windows 10 and Windows 11, x64',
    verificationHost: { platform: process.platform, architecture: process.arch },
    runtimeExecution: { performed: false, reason: 'Static package verification only; this script does not execute Windows binaries.' },
    zip: { path: zipPath, bytes: zipBytes.length, sha256: digest(zipBytes), integrityPassed: true, entryCount: zipCheck.entries.length },
    setup: { path: setupPath, ...setupPe, nsisSignaturePresent: true, integrityPassed: true, offlinePayload: payloadArchives[0],
      payloadIntegrityPassed: true, allZipFilesMatchPayload: true, payloadFileCount: payloadFiles.length,
      matchedZipFileCount: payloadComparisons.length, installerHelpers },
    requiredRuntimeFiles: required,
    applicationFileCount: applicationFiles.length,
    localeCount: applicationFiles.filter((file) => /^locales\/.*\.pak$/.test(file)).length,
    peFiles,
    packagedVersion: bundledPackage.version,
    frontend,
    shell,
    installerPayload: payloadComparisons,
  };
  await mkdir(outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, 'windows-artifacts.json'), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(path.join(outputRoot, 'windows-archive-integrity.txt'),
    `ZIP integrity\n${zipCheck.crcOutput}\nNSIS integrity\n${installerCheck.crcOutput}\nEmbedded x64 payload integrity\n${payloadCheck.crcOutput}`);
  console.log(`Windows ${report.version}: ZIP CRC, NSIS embedded payload, ${peFiles.length} x64 executable/DLL headers, ${frontend.length} production frontend files and ${shell.length} shell files verified.`);
  console.log(`All ${payloadComparisons.length} ZIP files match the installer payload; ${installerHelpers.length} installer-only elevation helper(s) separately inspected.`);
  console.log('Windows 10/11 runtime execution was not performed by this verification.');
  console.log(path.join(outputRoot, 'windows-artifacts.json'));
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
