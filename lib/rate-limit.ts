/**
 * Simple in-memory rate limiter
 * 基于 IP 的简单限流器
 */

interface RateLimitRecord {
    count: number
    resetTime: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()

// 清理过期记录 (每 5 分钟)
setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitMap.entries()) {
        if (now > record.resetTime) {
            rateLimitMap.delete(key)
        }
    }
}, 5 * 60 * 1000)

export interface RateLimitOptions {
    maxRequests: number    // 最大请求数
    windowMs: number       // 时间窗口 (毫秒)
}

export interface RateLimitResult {
    success: boolean
    remaining: number
    resetTime: number
}

/**
 * 检查是否超过限流
 * @param identifier 唯一标识符 (通常是 IP 或 userId)
 * @param options 限流选项
 */
export function checkRateLimit(
    identifier: string,
    options: RateLimitOptions = { maxRequests: 10, windowMs: 60 * 1000 }
): RateLimitResult {
    const now = Date.now()
    const record = rateLimitMap.get(identifier)

    // 如果没有记录或记录已过期，创建新记录
    if (!record || now > record.resetTime) {
        rateLimitMap.set(identifier, {
            count: 1,
            resetTime: now + options.windowMs
        })
        return {
            success: true,
            remaining: options.maxRequests - 1,
            resetTime: now + options.windowMs
        }
    }

    // 检查是否超过限制
    if (record.count >= options.maxRequests) {
        return {
            success: false,
            remaining: 0,
            resetTime: record.resetTime
        }
    }

    // 增加计数
    record.count++
    return {
        success: true,
        remaining: options.maxRequests - record.count,
        resetTime: record.resetTime
    }
}

/**
 * 从请求中获取客户端 IP
 */
export function getClientIP(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for')
    if (forwarded) {
        return forwarded.split(',')[0].trim()
    }
    return req.headers.get('x-real-ip') || 'unknown'
}
