import { describe, expect, it } from 'vitest';
import tokens from '../../design/visual-tokens.json';

const luminance = (hex: string) => {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
};
const contrast = (first: string, second: string) => {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
};

describe('cross-platform visual contract', () => {
  it('uses the approved ivory and a strictly black-and-white neutral palette', () => {
    expect(tokens.background).toBe('#FAF7F0');
    expect(tokens.ink).toBe('#000000');
    expect(tokens.field).toBe('#FFFFFF');
    expect(tokens.typography.mathematics[0]).toBe('Arial');
    expect(tokens.typography.text[0]).toBe('Baskerville');
  });

  it('keeps the three Learn tones readable with closely matched prominence', () => {
    expect(tokens.learn.inside).toBe(tokens.learn.outside);
    const ratios = [tokens.learn.first, tokens.learn.inside, tokens.learn.last]
      .map((color) => contrast(color, tokens.background));
    expect(Math.min(...ratios)).toBeGreaterThanOrEqual(4.5);
    expect(Math.max(...ratios) / Math.min(...ratios)).toBeLessThan(1.1);
    expect(contrast(tokens.ink, tokens.field)).toBeGreaterThanOrEqual(7);
    expect(contrast(tokens.ink, tokens.background)).toBeGreaterThanOrEqual(7);
  });

  it('keeps matching stage fills light and equally readable with bold colored text', () => {
    expect(tokens.learnFill.inside).toBe(tokens.learnFill.outside);
    const ratios = (['first', 'inside', 'last'] as const)
      .map((stage) => contrast(tokens.learn[stage], tokens.learnFill[stage]));
    expect(Math.min(...ratios)).toBeGreaterThanOrEqual(4.5);
    expect(Math.max(...ratios) / Math.min(...ratios)).toBeLessThan(1.1);
    for (const fill of Object.values(tokens.learnFill)) {
      expect(luminance(fill)).toBeGreaterThan(0.78);
    }
  });
});
