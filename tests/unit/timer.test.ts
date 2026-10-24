import { describe, expect, it } from 'vitest';
import { createTimer, formatTenths } from '../../src/timer';

describe('completed tenths formatting', () => {
  it.each([
    [0, '0.0'], [0.001, '0.0'], [99.999, '0.0'], [100, '0.1'],
    [199.999, '0.1'], [200, '0.2'], [999.999, '0.9'], [1000, '1.0'],
    [1099.999, '1.0'], [1234.567, '1.2'], [59_999.999, '59.9'], [60_000, '60.0'],
  ])('%f ms displays %s without early rounding', (elapsed, display) => {
    expect(formatTenths(elapsed)).toBe(display);
  });

  it('changes exactly at each tenth boundary and remains monotonic', () => {
    let previous = 0;
    for (let tenths = 1; tenths <= 1000; tenths += 1) {
      const boundary = tenths * 100;
      expect(formatTenths(boundary - 0.001)).toBe(((tenths - 1) / 10).toFixed(1));
      const display = formatTenths(boundary);
      expect(display).toBe((tenths / 10).toFixed(1));
      expect(Number(display)).toBeGreaterThanOrEqual(previous);
      previous = Number(display);
    }
  });
});

describe('injectable monotonic timer', () => {
  it('keeps high-resolution duration independently of display flooring and resets each problem', () => {
    let now = 700.125;
    const timer = createTimer(() => now);
    timer.reset();
    expect(timer.elapsed()).toBe(0);
    now += 99.9375;
    expect(timer.elapsed()).toBeCloseTo(99.9375, 8);
    expect(formatTenths(timer.elapsed())).toBe('0.0');
    now += 0.0625;
    expect(timer.elapsed()).toBe(100);
    expect(formatTenths(timer.elapsed())).toBe('0.1');
    timer.reset();
    expect(timer.elapsed()).toBe(0);
    now += 345.678;
    expect(timer.elapsed()).toBeCloseTo(345.678, 8);
  });
});
