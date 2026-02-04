import chalk from 'chalk';

/**
 * Simple sliding window rate limiter for API calls.
 * Tracks requests per hour for different operation types.
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limits: Map<string, number> = new Map();
  private readonly windowMs = 60 * 60 * 1000; // 1 hour in milliseconds

  constructor(limits: Record<string, number>) {
    Object.entries(limits).forEach(([operation, limit]) => {
      this.limits.set(operation, limit);
      this.requests.set(operation, []);
    });
  }

  /**
   * Check if an operation can be performed within rate limits.
   * If allowed, records the request. If not, displays an error and returns false.
   */
  checkLimit(operation: string): boolean {
    const limit = this.limits.get(operation);
    if (limit === undefined) {
      return true; // No limit configured for this operation
    }

    const now = Date.now();
    const timestamps = this.requests.get(operation) || [];

    // Remove timestamps outside the window
    const validTimestamps = timestamps.filter((ts) => now - ts < this.windowMs);
    this.requests.set(operation, validTimestamps);

    if (validTimestamps.length >= limit) {
      const oldestRequest = validTimestamps[0];
      const resetTime = new Date(oldestRequest + this.windowMs);
      const minutesUntilReset = Math.ceil((oldestRequest + this.windowMs - now) / 60000);

      console.error(chalk.red(`\n✖ Rate limit exceeded for ${operation}`));
      console.error(chalk.yellow(`  Limit: ${limit} requests per hour`));
      console.error(chalk.yellow(`  Resets at: ${resetTime.toLocaleTimeString()} (~${minutesUntilReset} min)`));
      return false;
    }

    // Record this request
    validTimestamps.push(now);
    this.requests.set(operation, validTimestamps);
    return true;
  }

  /**
   * Get remaining requests for an operation
   */
  getRemaining(operation: string): number {
    const limit = this.limits.get(operation);
    if (limit === undefined) return Infinity;

    const now = Date.now();
    const timestamps = this.requests.get(operation) || [];
    const validTimestamps = timestamps.filter((ts) => now - ts < this.windowMs);

    return Math.max(0, limit - validTimestamps.length);
  }
}
