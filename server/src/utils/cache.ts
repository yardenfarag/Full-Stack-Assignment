/**
 * Simple in-memory cache with TTL (Time To Live) support
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class Cache {
  private store = new Map<string, CacheEntry<any>>();

  /**
   * Get a value from cache if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a value in cache with TTL in milliseconds
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { data: value, expiresAt });
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Generate a cache key from an object (for performance queries)
   */
  static generateKey(prefix: string, obj: any): string {
    // Sort keys to ensure consistent key generation
    const sorted = Object.keys(obj)
      .sort()
      .map((key) => `${key}:${JSON.stringify(obj[key])}`)
      .join("|");
    return `${prefix}:${sorted}`;
  }
}

// Singleton instance
export const cache = new Cache();

