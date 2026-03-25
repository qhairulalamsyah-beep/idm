// Rate Limiting Middleware for API Routes
// Protects against spam and bot attacks

import { NextRequest, NextResponse } from 'next/server';

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Rate limit configuration
const RATE_LIMITS = {
  // Authentication endpoints - strict
  auth: { requests: 5, windowMs: 60 * 1000 }, // 5 requests per minute
  otp: { requests: 3, windowMs: 5 * 60 * 1000 }, // 3 requests per 5 minutes
  
  // Registration - moderate
  registration: { requests: 10, windowMs: 60 * 1000 }, // 10 per minute
  
  // API calls - relaxed
  api: { requests: 100, windowMs: 60 * 1000 }, // 100 per minute
  
  // Webhooks - very relaxed
  webhook: { requests: 1000, windowMs: 60 * 1000 }, // 1000 per minute
};

export type RateLimitType = keyof typeof RATE_LIMITS;

// Get client identifier from request
function getClientId(request: NextRequest): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  const ip = forwarded?.split(',')[0]?.trim() || realIp || cfIp || 'unknown';
  
  // Also include user agent hash for more uniqueness
  const userAgent = request.headers.get('user-agent') || '';
  const uaHash = simpleHash(userAgent);
  
  return `${ip}:${uaHash}`;
}

// Simple hash function
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Check rate limit
export function checkRateLimit(
  request: NextRequest,
  type: RateLimitType = 'api'
): { allowed: boolean; remaining: number; resetAt: number } {
  const clientId = getClientId(request);
  const config = RATE_LIMITS[type];
  const key = `${type}:${clientId}`;
  const now = Date.now();

  // Get or create record
  let record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    // Create new record
    record = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  }

  // Increment count
  record.count++;
  rateLimitStore.set(key, record);

  // Clean up old entries periodically
  if (rateLimitStore.size > 10000) {
    cleanupStore();
  }

  const allowed = record.count <= config.requests;
  const remaining = Math.max(0, config.requests - record.count);

  return {
    allowed,
    remaining,
    resetAt: record.resetAt,
  };
}

// Clean up expired entries
function cleanupStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Rate limit middleware wrapper
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  type: RateLimitType = 'api'
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = checkRateLimit(request, type);

    // Add rate limit headers
    const headers = {
      'X-RateLimit-Limit': String(RATE_LIMITS[type].requests),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    };

    if (!result.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            ...headers,
            'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    // Call original handler
    const response = await handler(request);

    // Add rate limit headers to response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

// Auth rate limit - for login/OTP
export function withAuthRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withRateLimit(handler, 'auth');
}

// Registration rate limit
export function withRegistrationRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withRateLimit(handler, 'registration');
}

// Clear rate limit for a client (e.g., after successful auth)
export function clearRateLimit(request: NextRequest, type: RateLimitType) {
  const clientId = getClientId(request);
  const key = `${type}:${clientId}`;
  rateLimitStore.delete(key);
}

const rateLimitService = {
  checkRateLimit,
  withRateLimit,
  withAuthRateLimit,
  withRegistrationRateLimit,
  clearRateLimit,
};

export default rateLimitService;
