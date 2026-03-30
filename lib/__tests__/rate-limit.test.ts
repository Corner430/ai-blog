/** @jest-environment node */
import { rateLimit, getClientIp } from '@/lib/rate-limit'

describe('rateLimit', () => {
  it('allows requests within limit', () => {
    const limiter = rateLimit({ maxRequests: 5, windowMs: 10_000 })

    for (let i = 0; i < 5; i++) {
      const result = limiter.check('1.2.3.4')
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4 - i)
      expect(result.limit).toBe(5)
    }
  })

  it('blocks requests exceeding limit', () => {
    const limiter = rateLimit({ maxRequests: 3, windowMs: 10_000 })

    // Use up the limit
    for (let i = 0; i < 3; i++) {
      const result = limiter.check('1.2.3.4')
      expect(result.success).toBe(true)
    }

    // 4th request should be blocked
    const result = limiter.check('1.2.3.4')
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.limit).toBe(3)
  })

  it('resets after window expires', () => {
    jest.useFakeTimers()

    const limiter = rateLimit({ maxRequests: 2, windowMs: 5_000 })

    // Use up the limit
    limiter.check('1.2.3.4')
    limiter.check('1.2.3.4')
    expect(limiter.check('1.2.3.4').success).toBe(false)

    // Advance past the window
    jest.advanceTimersByTime(5_001)

    // Should be allowed again
    const result = limiter.check('1.2.3.4')
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(1)

    jest.useRealTimers()
  })

  it('handles custom config', () => {
    const limiter = rateLimit({ maxRequests: 5, windowMs: 10_000 })

    for (let i = 0; i < 5; i++) {
      expect(limiter.check('10.0.0.1').success).toBe(true)
    }

    expect(limiter.check('10.0.0.1').success).toBe(false)
    expect(limiter.check('10.0.0.1').limit).toBe(5)
  })

  it('tracks different IPs independently', () => {
    const limiter = rateLimit({ maxRequests: 1, windowMs: 10_000 })

    expect(limiter.check('1.1.1.1').success).toBe(true)
    expect(limiter.check('1.1.1.1').success).toBe(false)

    // Different IP should still be allowed
    expect(limiter.check('2.2.2.2').success).toBe(true)
  })

  it('uses default config when none provided', () => {
    const limiter = rateLimit()
    const result = limiter.check('3.3.3.3')
    expect(result.success).toBe(true)
    expect(result.limit).toBe(20)
    expect(result.remaining).toBe(19)
  })
})

describe('getClientIp', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.50, 70.41.3.18, 150.172.238.178' },
    })
    expect(getClientIp(request)).toBe('203.0.113.50')
  })

  it('extracts single IP from x-forwarded-for header', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.50' },
    })
    expect(getClientIp(request)).toBe('203.0.113.50')
  })

  it('extracts IP from x-real-ip header', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-real-ip': '198.51.100.42' },
    })
    expect(getClientIp(request)).toBe('198.51.100.42')
  })

  it('prefers x-forwarded-for over x-real-ip', () => {
    const request = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '203.0.113.50',
        'x-real-ip': '198.51.100.42',
      },
    })
    expect(getClientIp(request)).toBe('203.0.113.50')
  })

  it('returns unknown as fallback when no IP headers present', () => {
    const request = new Request('http://localhost')
    expect(getClientIp(request)).toBe('unknown')
  })
})
