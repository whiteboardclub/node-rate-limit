import Redis from "ioredis";
import RedisStorage from "../src/storages/redis-storage"; // Path to your RedisStorage
import TokenBucketStrategy from "../src/strategies/token-bucket-strategy"; // Path to your TokenBucketStrategy
import { TokenBucketStrategyResponse } from "../src/interfaces/responses"; // Path to your response interface
import { TokenBucketStrategyOptions } from "../src/interfaces/options";

const redis = new Redis();

describe("TokenBucketStrategy with RedisStorage", () => {
  let redisStorage: RedisStorage;
  let tokenBucket: TokenBucketStrategy;
  const userKey = "user:123"; // Unique key to identify rate-limiting for a user

  beforeAll(async () => {
    if (redis.status && redis.status !== "ready" && redis.status !== "connecting") {
      await redis.connect();
    }

    redisStorage = new RedisStorage(redis);
    // 10 tokens, 2 token per second refill rate
    const options: TokenBucketStrategyOptions = { store: redisStorage, bucketCapacity: 10, refillRate: 2 };
    tokenBucket = new TokenBucketStrategy(options);

    // Use fake timers for controlling time
    jest.useFakeTimers();
  });

  afterAll(async () => {
    await redis.quit();
    jest.useRealTimers();
  });

  test("should allow a request if there are enough tokens", async () => {
    const result: TokenBucketStrategyResponse = await tokenBucket.check(userKey);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9); // Since we start with 10 tokens
  });

  test("should deny a request if there are not enough tokens", async () => {
    // Consuming all tokens
    for (let i = 0; i < 10; i++) {
      await tokenBucket.check(userKey);
    }

    const result: TokenBucketStrategyResponse = await tokenBucket.check(userKey);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    // Should indicate how long until retry
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  test("should refill tokens after some time", async () => {
    // Consuming all tokens
    for (let i = 0; i < 10; i++) {
      await tokenBucket.check(userKey);
    }

    const beforeResult: TokenBucketStrategyResponse = await tokenBucket.check(userKey);

    expect(beforeResult.remaining).toBe(0);

    // Simulate time passing (e.g., 3 seconds)
    jest.advanceTimersByTime(4000); // Advance by 3 seconds (refill rate is 2 token/sec)

    // Check tokens after 3 seconds
    const result: TokenBucketStrategyResponse = await tokenBucket.check(userKey);

    expect(result.allowed).toBe(true);
    // will check on this not working
    expect(result.remaining).toBe(7); // 3 seconds * 2 token/sec = 6 tokens refilled, so remaining = 6
  });

  test("should reset the bucket", async () => {
    // Consuming all tokens
    for (let i = 0; i < 10; i++) {
      await tokenBucket.check(userKey);
    }

    // Resetting the bucket
    await tokenBucket.reset(userKey);

    const result: TokenBucketStrategyResponse = await tokenBucket.check(userKey);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9); // After reset, we should have 10 tokens initially
  });
});
