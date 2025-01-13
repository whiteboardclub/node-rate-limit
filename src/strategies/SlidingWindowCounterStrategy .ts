import BaseStrategy from "../strategies/base-strategy";
import { SlidingWindowCounterResponse } from "../interfaces/responses";
import { SlidingWindowCounterOptions } from "../interfaces/options";

class SlidingWindowCounterStrategy extends BaseStrategy {
  private windowSize: number;
  private maxRequests: number;

  constructor(options: SlidingWindowCounterOptions) {
    if (!options.store) {
      throw new Error("A valid store implementation is required.");
    }
    super(options.store);

    if (options.windowSize <= 0 || options.maxRequests <= 0) {
      throw new Error("windowSize and maxRequests must be greater than 0.");
    }

    this.windowSize = options.windowSize;
    this.maxRequests = options.maxRequests;
  }

  /**
   * Generates the key for storing request timestamps.
   * @param key A unique key to identify the rate limit
   */
  private getSlidingWindowKey(key: string): string {
    return `sliding_window:${key}`;
  }

  /**
   * Records a request and calculates the current state of the sliding window.
   * @param key A unique key to identify the rate limit
   */
  async check(key: string): Promise<SlidingWindowCounterResponse> {
    const windowKey = this.getSlidingWindowKey(key);
    const now = Date.now();

    // Fetch existing timestamps from the store
    const timestamps: number[] = (await this.store.get(windowKey)) || [];

    // Filter out timestamps outside the sliding window
    const validTimestamps = timestamps.filter((timestamp) => now - timestamp <= this.windowSize);

    if (validTimestamps.length >= this.maxRequests) {
      const retryAfter = this.windowSize - (now - validTimestamps[0]);
      return {
        allowed: false,
        remaining: 0,
        retryAfter,
      };
    }

    // Add the current timestamp and save the updated array
    validTimestamps.push(now);
    await this.store.set(windowKey, validTimestamps);

    return {
      allowed: true,
      remaining: this.maxRequests - validTimestamps.length,
      retryAfter: 0,
    };
  }

  /**
   * Resets the sliding window state for a given key.
   * @param key A unique key to identify the rate limit
   */
  async reset(key: string): Promise<void> {
    const windowKey = this.getSlidingWindowKey(key);
    await this.store.delete(windowKey);
  }

  /**
   * Retrieves the current state of the sliding window without consuming a request.
   * @param key A unique key to identify the rate limit
   */
  async get(key: string): Promise<SlidingWindowCounterResponse> {
    const windowKey = this.getSlidingWindowKey(key);
    const now = Date.now();

    const timestamps: number[] = (await this.store.get(windowKey)) || [];
    const validTimestamps = timestamps.filter((timestamp) => now - timestamp <= this.windowSize);

    return {
      allowed: validTimestamps.length < this.maxRequests,
      remaining: this.maxRequests - validTimestamps.length,
      retryAfter: validTimestamps.length >= this.maxRequests
        ? this.windowSize - (now - validTimestamps[0])
        : 0,
    };
  }
}

export default SlidingWindowCounterStrategy;
