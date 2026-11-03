import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(await readFile(path.join(root, 'design/visual-tokens.json'), 'utf8'));
const family = (names) => names.map((name) => ['serif', 'sans-serif'].includes(name) ? name : `"${name}"`).join(', ');
const css = `/* Generated from design/visual-tokens.json. Run npm run design:tokens. */\n:root {\n${[
  ['paper', tokens.background], ['ink', tokens.ink], ['field', tokens.field],
  ...Object.entries(tokens.learn).map(([key, value]) => [`learn-${key}`, value]),
  ...Object.entries(tokens.learnFill).map(([key, value]) => [`learn-${key}-fill`, value]),
  ['font-text', family(tokens.typography.text)], ['font-math', family(tokens.typography.mathematics)],
  ...tokens.spacingPx.map((value, index) => [`space-${index + 1}`, `${value / 16}rem`]),
  ['border-control', `${tokens.borders.controlPx}px`], ['border-emphasis', `${tokens.borders.emphasisPx}px`],
  ['radius-control', `${tokens.borders.radiusPx}px`], ['target-min', `${tokens.controls.minimumTargetPx}px`],
  ['help-min', `${tokens.controls.learnHelpMinimumPx}px`],
].map(([key, value]) => `  --${key}: ${value};`).join('\n')}\n}\n`;

const color = (hex) => {
  const values = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
  return `UIColor(red: ${values[0]}.0 / 255, green: ${values[1]}.0 / 255, blue: ${values[2]}.0 / 255, alpha: 1)`;
};
const swift = `// Generated from design/visual-tokens.json. Run npm run design:tokens.\nimport UIKit\n\n@MainActor\nenum VisualTokens {\n${[
  ['paper', color(tokens.background)], ['ink', color(tokens.ink)], ['field', color(tokens.field)],
  ...Object.entries(tokens.learn).map(([key, value]) => [key, color(value)]),
  ...Object.entries(tokens.learnFill).map(([key, value]) => [`${key}Fill`, color(value)]),
].map(([key, value]) => `    static let ${key} = ${value}`).join('\n')}
    nonisolated static let textFontName = "${tokens.typography.nativeText}"
    nonisolated static let mathFontName = "${tokens.typography.nativeMathematics}"
    nonisolated static let controlBorder: CGFloat = ${tokens.borders.controlPx}
    nonisolated static let emphasisBorder: CGFloat = ${tokens.borders.emphasisPx}
    nonisolated static let cornerRadius: CGFloat = ${tokens.borders.radiusPx}
    nonisolated static let minimumTarget: CGFloat = ${tokens.controls.minimumTargetPx}
    nonisolated static let learnHelpMinimum: CGFloat = ${tokens.controls.learnHelpMinimumPx}
    nonisolated static let spacing: [CGFloat] = [${tokens.spacingPx.join(', ')}]
}\n`;
const xml = `<?xml version="1.0" encoding="utf-8"?>\n<!-- Generated from design/visual-tokens.json. Run npm run design:tokens. -->\n<resources>\n    <color name="visual_paper">${tokens.background}</color>\n    <color name="visual_ink">${tokens.ink}</color>\n    <color name="visual_field">${tokens.field}</color>\n</resources>\n`;
const files = [
  ['src/designTokens.css', css],
  ['ios/MentalArithmetic/UI/VisualTokens.generated.swift', swift],
  ['android/app/src/main/res/values/visual_tokens.xml', xml],
];
for (const [relative, content] of files) {
  const file = path.join(root, relative);
  if (process.argv.includes('--check')) {
    if (await readFile(file, 'utf8') !== content) throw new Error(`Regenerate visual tokens: ${relative}`);
  } else await writeFile(file, content);
}
console.log(`${process.argv.includes('--check') ? 'Verified' : 'Generated'} ${files.length} platform token files.`);
