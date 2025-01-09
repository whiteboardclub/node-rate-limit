import RedisStorage from "../storages/redis-storage";

interface TokenBucketStrategyOptions {
  store: RedisStorage;
  bucketCapacity: number;
  refillRate: number;
}

export { TokenBucketStrategyOptions };
