interface BaseResponse {
    allowed: boolean;
  }
  
  interface SlidingWindowCounterResponse {
    allowed: boolean;
    remaining: number;
    retryAfter: number; // in milliseconds
  }
  
  export { BaseResponse, SlidingWindowCounterResponse };