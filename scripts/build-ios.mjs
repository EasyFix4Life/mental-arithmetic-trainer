import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspace = resolve(root, '../..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const simulator = process.argv.includes('--simulator');
const release = resolve(root, 'release');
mkdirSync(release, { recursive: true });
const beta = '/Applications/Xcode-beta.app/Contents/Developer';
const env = { ...process.env };
if (!env.DEVELOPER_DIR && existsSync(beta)) env.DEVELOPER_DIR = beta;
const archive = resolve(workspace, 'work/ios', `Mental-Arithmetic-${pkg.version}-iOS-unsigned.xcarchive`);
const derived = resolve(workspace, 'work/ios', simulator ? 'SimulatorDerivedData' : 'ArchiveDerivedData');
const args = ['-project', resolve(root, 'ios/MentalArithmetic.xcodeproj'), '-scheme', 'MentalArithmetic',
  '-configuration', 'Release', '-destination', simulator ? 'generic/platform=iOS Simulator' : 'generic/platform=iOS',
  '-derivedDataPath', derived, 'CODE_SIGNING_ALLOWED=NO',
  ...(simulator ? ['build'] : ['-archivePath', archive, 'archive'])];
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run('xcodebuild', args);
const source = simulator ? resolve(derived, 'Build/Products/Release-iphonesimulator/MentalArithmetic.app') : archive;
const output = resolve(release, `Mental-Arithmetic-${pkg.version}-iOS-${simulator ? 'Simulator-app' : 'unsigned-archive'}.zip`);
run('/usr/bin/ditto', ['-c', '-k', '--keepParent', source, output]);
console.log(`Created ${output}`);
console.log(simulator ? 'Simulator app only; cannot be installed on a physical iPhone.' : 'Unsigned archive; select your Apple Developer team in Xcode before device distribution or App Store submission.');
