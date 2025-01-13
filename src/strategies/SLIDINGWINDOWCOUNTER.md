# Sliding Window Counter Strategy

`SlidingWindowCounterStrategy` is a scalable and efficient implementation of the sliding window algorithm for rate-limiting requests. It is designed to handle distributed environments seamlessly by leveraging various storage backends, such as Redis.

---

## Features

- **Scalable**: Suitable for distributed systems and high-concurrency scenarios.
- **Configurable**: Allows customization of window size and maximum request limits.
- **Multiple Storage Options**: Integrates with Redis and other supported storage systems.
- **Precision**: Sliding window mechanism ensures accurate rate-limiting within a given window size.

---

## Usage

### Basic Example

```typescript
import Redis from "ioredis";
import { SlidingWindowCounterStrategy, RedisStorage } from "node-rate-limit";

const redis = new Redis();

// Create an instance of RedisStorage
const redisStorage = new RedisStorage(redis);

// Configure the SlidingWindowCounterStrategy
const slidingWindow = new SlidingWindowCounterStrategy({
  store: redisStorage,
  maxRequests: 10, // Maximum number of requests allowed in the window
  windowSize: 60000, // Window size in milliseconds (e.g., 60 seconds)
});

// Define a unique key to track the rate limit (e.g., user ID, IP address)
const userKey = "user:123";

(async () => {
  // Check if a request is allowed
  const response = await slidingWindow.check(userKey);

  if (response.allowed) {
    console.log(`Request allowed. Remaining requests: ${response.remaining}`);
  } else {
    console.log(`Request denied. Retry after ${response.retryAfter}ms.`);
  }

  // Reset the sliding window for a user
  await slidingWindow.reset(userKey);

  // Retrieve the current state of the sliding window
  const state = await slidingWindow.get(userKey);
  console.log(`Remaining requests in window: ${state.remaining}`);
})();
```

---

## API Documentation

### `SlidingWindowCounterStrategy`

#### Constructor

```typescript
new SlidingWindowCounterStrategy(options: SlidingWindowCounterStrategyOptions)
```

#### Options

| Option         | Type          | Required | Description                                                                     |
| -------------- | ------------- | -------- | ------------------------------------------------------------------------------- |
| `store`        | `BaseStorage` | Yes      | An instance of `BaseStorage` or any compatible storage backend.                 |
| `maxRequests`  | `number`      | Yes      | The maximum number of requests allowed in the sliding window. Must be a positive integer. |
| `windowSize`   | `number`      | Yes      | The size of the sliding window in milliseconds. Must be a positive integer.     |

#### Example

```typescript
const options = {
  store: redisStorage,
  maxRequests: 10,
  windowSize: 60000,
};
const slidingWindow = new SlidingWindowCounterStrategy(options);
```

---

### Methods

#### `check(key: string): Promise<SlidingWindowCounterResponse>`

Checks whether a request is allowed based on the current sliding window state.

- **Parameters**:
  - `key`: A unique key to identify the rate limit (e.g., user ID, IP address).
- **Returns**:
  - `allowed`: `boolean` - Whether the request is allowed.
  - `remaining`: `number` - The number of requests remaining in the current window.
  - `retryAfter`: `number` - The time in milliseconds until the next request is allowed (if `allowed` is `false`).

#### Example

```typescript
const response = await slidingWindow.check("user:123");
if (response.allowed) {
  console.log("Request is allowed");
} else {
  console.log(`Retry after ${response.retryAfter}ms`);
}
```

---

#### `reset(key: string): Promise<void>`

Resets the sliding window for a specific key, removing all associated data.

- **Parameters**:
  - `key`: A unique key to identify the rate limit.

#### Example

```typescript
await slidingWindow.reset("user:123");
```

---

#### `get(key: string): Promise<SlidingWindowCounterResponse>`

Retrieves the current state of the sliding window without consuming any requests.

- **Parameters**:
  - `key`: A unique key to identify the rate limit.
- **Returns**:
  - `allowed`: `boolean` - Whether requests are currently allowed.
  - `remaining`: `number` - The number of requests remaining in the current window.
  - `retryAfter`: `number` - The time in milliseconds until the next request is allowed.

#### Example

```typescript
const state = await slidingWindow.get("user:123");
console.log(`Remaining requests: ${state.remaining}`);
```

---

## Error Handling

### Validation Errors

The constructor throws errors if invalid options are provided:

- `maxRequests` and `windowSize` must be positive integers.
- A valid store implementation is required.

### Example

```typescript
try {
  new SlidingWindowCounterStrategy({
    store: redisStorage,
    maxRequests: 0,
    windowSize: -1000,
  });
} catch (err) {
  console.error(err.message); // "maxRequests and windowSize must be greater than 0."
}
```

---

## Advanced Configuration

### Custom Storage Backend

You can implement your own storage backend by extending the `BaseStorage` class and passing it to the `SlidingWindowCounterStrategy`.

#### Example

```typescript
class CustomStorage extends BaseStorage {
  async set(key: string, value: any, ttl?: number): Promise<void> {
    // Custom implementation
  }

  async get(key: string): Promise<any> {
    // Custom implementation
  }

  async delete(key: string): Promise<void> {
    // Custom implementation
  }
}

const customStorage = new CustomStorage();
const slidingWindow = new SlidingWindowCounterStrategy({
  store: customStorage,
  maxRequests: 15,
  windowSize: 30000,
});
```

---

## Benefits

1. **Distributed Rate-Limiting**: Suitable for microservices and multi-instance environments.
2. **Customizable**: Adjustable window size and request limits to meet specific use cases.
3. **Precise Control**: Accurate rate-limiting within the defined window size using sorted sets.

--- 

For more details or troubleshooting, refer to the documentation or contact support.