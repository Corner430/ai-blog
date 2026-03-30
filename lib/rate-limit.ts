// In-memory rate limiter
// Map<string, { count: number; resetTime: number }> keyed by IP address
// Default: 20 requests per 60-second window
// Lazy cleanup of expired entries

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60_000, // 1 minute
}

export function rateLimit(config?: Partial<RateLimitConfig>) {
  const { maxRequests, windowMs } = { ...DEFAULT_CONFIG, ...config }
  const store = new Map<string, RateLimitEntry>()

  // Lazy cleanup: remove expired entries periodically
  let lastCleanup = Date.now()
  const CLEANUP_INTERVAL = windowMs * 2

  function cleanup() {
    const now = Date.now()
    if (now - lastCleanup < CLEANUP_INTERVAL) return
    lastCleanup = now
    for (const [key, entry] of store) {
      if (now >= entry.resetTime) {
        store.delete(key)
      }
    }
  }

  function check(ip: string): {
    success: boolean
    remaining: number
    limit: number
    resetTime: number
  } {
    cleanup()

    const now = Date.now()
    const entry = store.get(ip)

    // No existing entry or window expired — start fresh
    if (!entry || now >= entry.resetTime) {
      const resetTime = now + windowMs
      store.set(ip, { count: 1, resetTime })
      return { success: true, remaining: maxRequests - 1, limit: maxRequests, resetTime }
    }

    // Within window
    entry.count++
    if (entry.count > maxRequests) {
      return { success: false, remaining: 0, limit: maxRequests, resetTime: entry.resetTime }
    }

    return {
      success: true,
      remaining: maxRequests - entry.count,
      limit: maxRequests,
      resetTime: entry.resetTime,
    }
  }

  return { check }
}

export function getClientIp(request: Request): string {
  const headers = request.headers

  // Vercel / proxies set x-forwarded-for
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; take the first (client) IP
    return forwarded.split(',')[0].trim()
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  return 'unknown'
}
