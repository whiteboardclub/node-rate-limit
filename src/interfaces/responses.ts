interface BaseResponse {
  allowed: boolean;
}

interface TokenBucketStrategyResponse {
  allowed: boolean;
  remaining: number;
  retryAfter: number; // in milliseconds
}

export { BaseResponse, TokenBucketStrategyResponse };
