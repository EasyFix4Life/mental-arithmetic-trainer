export type Clock = () => number;

export interface Timer {
  reset(): void;
  elapsed(): number;
}

/** Display completed tenths only; preserve full precision in timer state. */
export function formatTenths(elapsedMs: number): string {
  const completedTenths = Math.floor(Math.max(0, elapsedMs) / 100);
  return (completedTenths / 10).toFixed(1);
}

export function createTimer(clock: Clock = () => performance.now()): Timer {
  let startedAt = clock();
  return {
    reset(): void {
      startedAt = clock();
    },
    elapsed(): number {
      return Math.max(0, clock() - startedAt);
    },
  };
}
