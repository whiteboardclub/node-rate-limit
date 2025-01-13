import RedisStorage from "../storages/redis-storage";

interface SlidingWindowCounterOptions {
    store: RedisStorage;
    windowSize: number; // in milliseconds
    maxRequests: number;
  }

export { SlidingWindowCounterOptions };