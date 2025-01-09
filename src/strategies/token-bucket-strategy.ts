import BaseStrategy from "../strategies/base-strategy";
import { TokenBucketStrategyResponse } from "../interfaces/responses";
import { TokenBucketStrategyOptions } from "../interfaces/options";

class TokenBucketStrategy extends BaseStrategy {
  private bucketCapacity: number;
  private refillRate: number; // Tokens per second

  /**
   * Constructor for TokenBucketStrategy
   * @param options An instance of TokenBucketStrategyOptions for all options allowed in the strategy
   */
  constructor(options: TokenBucketStrategyOptions) {
    super(options.store);
    this.bucketCapacity = options.bucketCapacity;
    this.refillRate = options.refillRate;
  }

  /**
   * Checks if a request is allowed under the token bucket strategy.
   * @param key A unique key to identify the rate limit (e.g., user ID or API key)
   * @returns BaseResponse indicating if the request is allowed and remaining tokens
   */
  async check(key: string): Promise<TokenBucketStrategyResponse> {
    const now = Date.now();
    const bucketKey = `token_bucket:${key}`;
    const lastRefillKey = `${bucketKey}:last_refill`;

    // Retrieve current tokens and last refill timestamp
    const currentTokens = (await this.store.get(bucketKey)) ?? this.bucketCapacity;
    const lastRefill = (await this.store.get(lastRefillKey)) ?? now;

    // Calculate elapsed time and refill tokens
    const elapsedTime = (now - lastRefill) / 1000; // in seconds
    const refillTokens = Math.floor(elapsedTime * this.refillRate);
    const updatedTokens = Math.min(this.bucketCapacity, currentTokens + refillTokens);

    // Update the last refill timestamp
    await this.store.set(lastRefillKey, now);

    if (updatedTokens < 1) {
      const retryAfter = Math.ceil((1 - updatedTokens) / this.refillRate) * 1000; // in milliseconds
      return {
        allowed: false,
        remaining: 0,
        retryAfter,
      };
    }

    // Consume a token
    await this.store.set(bucketKey, updatedTokens - 1);

    return {
      allowed: true,
      remaining: updatedTokens - 1,
      retryAfter: 0,
    };
  }

  /**
   * Resets the token bucket state for a given key.
   * @param key A unique key to identify the rate limit
   */
  async reset(key: string): Promise<void> {
    const bucketKey = `token_bucket:${key}`;
    const lastRefillKey = `${bucketKey}:last_refill`;

    await this.store.delete(bucketKey);
    await this.store.delete(lastRefillKey);
  }
}

export default TokenBucketStrategy;
