/**
 * Simple in-memory rate limiter for API routes
 * Note: This only works within a single server instance.
 * For production with multiple instances, use Redis or similar.
 */

interface RateLimitRecord {
  count: number
  timestamp: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()

// Clean up old entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutes

    rateLimitMap.forEach((record, key) => {
      if (now - record.timestamp > maxAge) {
        rateLimitMap.delete(key)
      }
    })
  }, 5 * 60 * 1000)
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the client (IP, user ID, etc.)
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 1 minute)
 * @returns true if request is allowed, false if rate limited
 */
export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  // First request from this identifier
  if (!record) {
    rateLimitMap.set(identifier, { count: 1, timestamp: now })
    return true
  }

  // Window has expired, reset
  if (now - record.timestamp > windowMs) {
    rateLimitMap.set(identifier, { count: 1, timestamp: now })
    return true
  }

  // Within window, check count
  if (record.count >= limit) {
    return false
  }

  // Increment and allow
  record.count++
  return true
}

/**
 * Get remaining requests for an identifier
 */
export function getRateLimitRemaining(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): number {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now - record.timestamp > windowMs) {
    return limit
  }

  return Math.max(0, limit - record.count)
}

/**
 * Get time until rate limit resets (in ms)
 */
export function getRateLimitReset(
  identifier: string,
  windowMs: number = 60000
): number {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record) {
    return 0
  }

  const resetTime = record.timestamp + windowMs
  return Math.max(0, resetTime - now)
}
