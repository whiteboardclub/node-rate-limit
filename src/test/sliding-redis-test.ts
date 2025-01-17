import Redis from "ioredis";
import RedisStorage from "../storages/redis-storage";
import SlidingWindowCounterStrategy from "../strategies/SlidingWindowCounterStrategy";
import { SlidingWindowCounterOptions } from "../interfaces/options";

const redis = new Redis();

describe("SlidingWindowCounterStrategy with RedisStorage", () => {
  let redisStorage: RedisStorage;
  let slidingWindow: SlidingWindowCounterStrategy;
  const userKey = "user:123";

  beforeAll(async () => {
    if (redis.status && redis.status !== "ready" && redis.status !== "connecting") {
      await redis.connect();
    }
    redisStorage = new RedisStorage(redis);
    jest.useFakeTimers();
  });

  afterAll(async () => {
    await redis.quit();
    jest.useRealTimers();
  });

  beforeEach(async () => {
    await redisStorage.delete(`sliding_window:${userKey}`);
    const options: SlidingWindowCounterOptions = { 
      store: redisStorage, 
      maxRequests: 10, 
      windowSize: 60000 
    };
    slidingWindow = new SlidingWindowCounterStrategy(options);
  });

  test("should allow a request within the allowed limit", async () => {
    const result = await slidingWindow.check(userKey);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  test("should deny a request if the rate limit is exceeded", async () => {
    for (let i = 0; i < 10; i++) {
      await slidingWindow.check(userKey);
    }
    const result = await slidingWindow.check(userKey);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  test("should reset the sliding window for a key", async () => {
    for (let i = 0; i < 10; i++) {
      await slidingWindow.check(userKey);
    }
    await slidingWindow.reset(userKey);

    const result = await slidingWindow.check(userKey);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  test("should retrieve the current state without consuming a request", async () => {
    const stateBefore = await slidingWindow.get(userKey);
    expect(stateBefore.remaining).toBe(10);
    expect(stateBefore.allowed).toBe(true);

    await slidingWindow.check(userKey);

    const stateAfter = await slidingWindow.get(userKey);
    expect(stateAfter.remaining).toBe(9);
    expect(stateAfter.allowed).toBe(true);
  });

  test("should handle invalid options with non-positive maxRequests", () => {
    expect(() => {
      new SlidingWindowCounterStrategy({
        store: redisStorage,
        maxRequests: 0,
        windowSize: 60000,
      });
    }).toThrow("maxRequests must be greater than 0.");
  });

  test("should handle invalid options with non-integer windowSize", () => {
    expect(() => {
      new SlidingWindowCounterStrategy({
        store: redisStorage,
        maxRequests: 10,
        windowSize: 60000.5,
      });
    }).toThrow("windowSize must be an integer.");
  });

  test("should calculate retryAfter correctly when the rate limit is exceeded", async () => {
    for (let i = 0; i < 10; i++) {
      await slidingWindow.check(userKey);
    }

    const result = await slidingWindow.check(userKey);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  test("should allow requests again after the window resets", async () => {
    for (let i = 0; i < 10; i++) {
      await slidingWindow.check(userKey);
    }

    jest.advanceTimersByTime(60000); // Advance time by window size
    const result = await slidingWindow.check(userKey);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });
});
