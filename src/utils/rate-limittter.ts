// will comeback on this
export abstract class RateLimiter {
  protected limit: number;
  protected duration: number;

  constructor(limit: number, duration: number) {
    this.limit = limit;
    this.duration = duration;
  }
}
