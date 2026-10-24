import { spawn } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.platform !== 'darwin') throw new Error('Build the macOS application on macOS.');
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directoryOnly = process.argv.includes('--dir');
// Synced Documents providers attach FinderInfo to .app/.framework directories,
// which codesign rejects. Package outside that provider; publish archive files.
const stagingRoot = await mkdtemp(path.join(tmpdir(), 'mental-arithmetic-mac-'));
const releaseRoot = path.join(projectRoot, 'release');
await mkdir(releaseRoot, { recursive: true });
const builderArgs = [
  path.join(projectRoot, 'node_modules/electron-builder/cli.js'),
  '--config', path.join(projectRoot, 'electron-builder.json'),
  `--config.directories.output=${stagingRoot}`,
  '--mac', ...(directoryOnly ? ['dir'] : ['dmg', 'zip']), '--arm64',
];
const exitCode = await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, builderArgs, { cwd: projectRoot, stdio: 'inherit' });
  child.once('error', reject);
  child.once('exit', (code) => resolve(code ?? 1));
});
if (exitCode !== 0) process.exit(Number(exitCode));
const artifacts = [];
for (const name of await readdir(stagingRoot)) {
  if (!/\.(dmg|zip|blockmap)$/.test(name)) continue;
  const destination = path.join(releaseRoot, name);
  await copyFile(path.join(stagingRoot, name), destination);
  artifacts.push(destination);
}
const location = {
  platform: 'darwin', architecture: 'arm64',
  appPath: path.join(stagingRoot, 'mac-arm64', 'Mental Arithmetic.app'),
  artifacts,
};
await mkdir(path.join(projectRoot, 'verification'), { recursive: true });
await writeFile(path.join(projectRoot, 'verification/desktop-build-location.json'), `${JSON.stringify(location, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(location, null, 2)}\n`);
