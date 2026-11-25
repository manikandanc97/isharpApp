import { HttpException, HttpStatus } from '@nestjs/common';

interface Bucket {
  timestamps: number[];
}

export class SlidingWindowRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number,
  ) {}

  consume(key: string): void {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const bucket = this.buckets.get(key) ?? { timestamps: [] };
    bucket.timestamps = bucket.timestamps.filter((ts) => ts > cutoff);

    if (bucket.timestamps.length >= this.maxRequests) {
      throw new HttpException(
        'Too many requests. Please wait a moment before trying again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.timestamps.push(now);
    this.buckets.set(key, bucket);

    // Periodic cleanup to prevent unbounded memory growth
    if (this.buckets.size > 5000) {
      for (const [k, b] of this.buckets.entries()) {
        if (b.timestamps.every((ts) => ts <= cutoff)) {
          this.buckets.delete(k);
        }
      }
    }
  }
}
