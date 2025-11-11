/**
 * Simple In-Memory Cache
 * Caches data with TTL (Time To Live)
 */

class Cache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Set cache value with TTL
   * @param {String} key - Cache key
   * @param {*} value - Value to cache
   * @param {Number} ttl - Time to live in seconds
   */
  set(key, value, ttl = 60) {
    const expiresAt = Date.now() + (ttl * 1000);
    this.cache.set(key, {
      value,
      expiresAt
    });
  }

  /**
   * Get cache value
   * @param {String} key - Cache key
   * @returns {*} Cached value or null if expired/not found
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Check if key exists and is not expired
   * @param {String} key - Cache key
   * @returns {Boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete cache entry
   * @param {String} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache size
   * @returns {Number}
   */
  size() {
    return this.cache.size;
  }

  /**
   * Clean expired entries
   */
  cleanExpired() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function
   * @param {String} key - Cache key
   * @param {Function} fn - Function to execute if cache miss
   * @param {Number} ttl - Time to live in seconds
   */
  async getOrSet(key, fn, ttl = 60) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fn();
    this.set(key, value, ttl);
    return value;
  }
}

// Create singleton instance
const cache = new Cache();

// Clean expired entries every minute (only in non-test environment)
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    cache.cleanExpired();
  }, 60000);
}

module.exports = cache;
