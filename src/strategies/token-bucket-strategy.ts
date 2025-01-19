import BaseStrategy from "../strategies/base-strategy";
import { TokenBucketStrategyResponse } from "../interfaces/responses";
import { TokenBucketStrategyOptions } from "../interfaces/options";

class TokenBucketStrategy extends BaseStrategy {
  private bucketCapacity: number;
  private refillRate: number; // Tokens per second

  /**
   * Constructor for TokenBucketStrategy
   * @param options An instance of TokenBucketStrategyOptions
   */
  constructor(options: TokenBucketStrategyOptions) {
    if (!options.store) {
      throw new Error("A valid store implementation is required.");
    }

    super(options.store);

    this.validateOptions(options);
    this.bucketCapacity = options.bucketCapacity;
    this.refillRate = options.refillRate;
  }

  /**
   * Validates the options provided to the constructor.
   * @param options The TokenBucketStrategyOptions to validate
   */
  private validateOptions(options: TokenBucketStrategyOptions): void {
    if (options.bucketCapacity <= 0 || options.refillRate <= 0) {
      throw new Error("bucketCapacity and refillRate must be greater than 0.");
    }
    if (!Number.isInteger(options.bucketCapacity) || !Number.isInteger(options.refillRate)) {
      throw new Error("bucketCapacity and refillRate must be integers.");
    }
  }

  /**
   * Generates keys for token bucket and last refill timestamp.
   * @param key A unique key to identify the rate limit
   */
  private getTokenBucketKeys(key: string): { bucketKey: string; lastRefillKey: string } {
    return {
      bucketKey: `token_bucket:${key}`,
      lastRefillKey: `token_bucket:${key}:last_refill`,
    };
  }

  /**
   * Calculates the updated token count based on elapsed time.
   * @param currentTokens Current token count
   * @param lastRefill Last refill timestamp
   */
  private calculateUpdatedTokens(
    currentTokens: number,
    lastRefill: number
  ): { updatedTokens: number; lastRefill: number } {
    const now = Date.now();
    const elapsedTime = (now - lastRefill) / 1000; // in seconds
    const refillTokens = elapsedTime * this.refillRate;
    const updatedTokens = Math.min(this.bucketCapacity, currentTokens + refillTokens);

    return { updatedTokens: Math.floor(updatedTokens), lastRefill: now };
  }

  /**
   * Retrieves the current state of the token bucket.
   * @param key A unique key to identify the rate limit
   */
  private async getTokenBucketState(key: string): Promise<{ updatedTokens: number; lastRefill: number }> {
    const { bucketKey, lastRefillKey } = this.getTokenBucketKeys(key);

    const currentTokens = parseFloat((await this.store.get(bucketKey)) ?? this.bucketCapacity.toString());
    const lastRefill = parseInt((await this.store.get(lastRefillKey)) ?? Date.now().toString());

    return this.calculateUpdatedTokens(currentTokens, lastRefill);
  }

  /**
   * Updates the token bucket state in the store.
   * @param key A unique key to identify the rate limit
   * @param tokens Updated token count
   * @param lastRefill Last refill timestamp
   */
  private async updateTokenBucketState(key: string, tokens: number, lastRefill: number): Promise<void> {
    const { bucketKey, lastRefillKey } = this.getTokenBucketKeys(key);
    await this.store.set(bucketKey, tokens);
    await this.store.set(lastRefillKey, lastRefill);
  }

  /**
   * Calculates the retry after time in milliseconds.
   * @param tokens Current token count
   */
  private calculateRetryAfter(tokens: number): number {
    if (this.isRequestAllowed(tokens)) return 0;
    return Math.ceil((1 - tokens) / this.refillRate) * 1000;
  }

  /**
   * Checks if the request can be allowed based on token count.
   * @param tokens Current token count
   */
  private isRequestAllowed(tokens: number): boolean {
    return tokens >= 1;
  }

  /**
   * Checks if a request is allowed under the token bucket strategy.
   * @param key A unique key to identify the rate limit
   */
  async check(key: string): Promise<TokenBucketStrategyResponse> {
    const { updatedTokens, lastRefill } = await this.getTokenBucketState(key);

    if (!this.isRequestAllowed(updatedTokens)) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: this.calculateRetryAfter(updatedTokens),
      };
    }

    await this.updateTokenBucketState(key, updatedTokens - 1, lastRefill);

    return {
      allowed: true,
      remaining: updatedTokens - 1,
      retryAfter: this.calculateRetryAfter(updatedTokens - 1),
    };
  }

  /**
   * Resets the token bucket state for a given key.
   * @param key A unique key to identify the rate limit
   */
  async reset(key: string): Promise<void> {
    const { bucketKey, lastRefillKey } = this.getTokenBucketKeys(key);
    await this.store.delete(bucketKey);
    await this.store.delete(lastRefillKey);
  }

  /**
   * Retrieves the current token bucket state without consuming a token.
   * @param key A unique key to identify the rate limit
   */
  async get(key: string): Promise<TokenBucketStrategyResponse> {
    const { updatedTokens } = await this.getTokenBucketState(key);

    return {
      allowed: this.isRequestAllowed(updatedTokens),
      remaining: updatedTokens,
      retryAfter: this.calculateRetryAfter(updatedTokens),
    };
  }
}

export default TokenBucketStrategy;
