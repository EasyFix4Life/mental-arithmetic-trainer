import { spawn } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stagingRoot = await mkdtemp(path.join(tmpdir(), 'mental-arithmetic-windows-'));
const releaseRoot = path.join(projectRoot, 'release');
await mkdir(releaseRoot, { recursive: true });
const builderArgs = [
  path.join(projectRoot, 'node_modules/electron-builder/cli.js'),
  '--config', path.join(projectRoot, 'electron-builder.windows.json'),
  `--config.directories.output=${stagingRoot}`,
  '--win', 'nsis', 'zip', '--x64', '--publish', 'never',
];
const exitCode = await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, builderArgs, { cwd: projectRoot, stdio: 'inherit' });
  child.once('error', reject);
  child.once('exit', (code) => resolve(code ?? 1));
});
if (exitCode !== 0) process.exit(Number(exitCode));
const artifacts = [];
for (const name of await readdir(stagingRoot)) {
  if (!/\.(exe|zip|blockmap)$/.test(name)) continue;
  const destination = path.join(releaseRoot, name);
  await copyFile(path.join(stagingRoot, name), destination);
  artifacts.push(destination);
}
const location = {
  version: JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8')).version,
  buildHost: process.platform,
  targetPlatform: 'win32',
  architecture: 'x64',
  appDirectory: path.join(stagingRoot, 'win-unpacked'),
  executablePath: path.join(stagingRoot, 'win-unpacked', 'Mental Arithmetic.exe'),
  artifacts,
};
await mkdir(path.join(projectRoot, 'verification'), { recursive: true });
await writeFile(path.join(projectRoot, 'verification/windows-build-location.json'), `${JSON.stringify(location, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(location, null, 2)}\n`);
