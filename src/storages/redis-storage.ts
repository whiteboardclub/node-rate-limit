import { StorageType } from "../constants/storage-type";
import BaseStorage from "../storages/base-storage";

class RedisStorage extends BaseStorage {
  private redisClient: any;

  /**
   * Constructor for RedisStorage
   * @param redisClient A Redis client instance provided by the user
   */
  constructor(redisClient: any) {
    super(StorageType.redis);

    if (!redisClient || typeof redisClient.set !== "function") {
      throw new Error("A valid Redis client instance must be provided.");
    }

    this.redisClient = redisClient;
  }

  /**
   * Stores a value in Redis with an optional TTL (time-to-live).
   * @param key The key under which the value is stored
   * @param value The value to store
   * @param ttl Optional TTL in seconds
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (ttl) {
      await this.redisClient.set(key, serializedValue, "EX", ttl);
    } else {
      await this.redisClient.set(key, serializedValue);
    }
  }

  /**
   * Retrieves a value from Redis.
   * @param key The key to retrieve the value for
   * @returns The parsed value or `null` if the key does not exist
   */
  async get(key: string): Promise<any> {
    const data = await this.redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Deletes a key from Redis.
   * @param key The key to delete
   */
  async delete(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  /**
   * Returns the underlying Redis client for advanced use cases.
   * @returns The Redis client instance
   */
  getRedisClient(): any {
    return this.redisClient;
  }
}

export default RedisStorage;