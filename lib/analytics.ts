/**
 * Simple Analytics - 轻量级用户行为统计
 * 存储在 localStorage，可选上报到服务器
 */

interface AnalyticsEvent {
    type: string
    timestamp: number
    data?: Record<string, any>
}

const STORAGE_KEY = 'mi70_analytics'
const MAX_EVENTS = 100

/**
 * 记录事件
 */
export function trackEvent(type: string, data?: Record<string, any>) {
    if (typeof window === 'undefined') return

    try {
        const events: AnalyticsEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')

        events.push({
            type,
            timestamp: Date.now(),
            data
        })

        // 保留最近 100 条记录
        if (events.length > MAX_EVENTS) {
            events.splice(0, events.length - MAX_EVENTS)
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
    } catch (e) {
        console.warn('[Analytics] Failed to track event:', e)
    }
}

/**
 * 记录页面访问
 */
export function trackPageView(path: string) {
    trackEvent('page_view', { path })
}

/**
 * 记录生成任务
 */
export function trackGeneration(style: string, aspectRatio: string) {
    trackEvent('generation', { style, aspectRatio })
}

/**
 * 记录错误
 */
export function trackError(message: string, stack?: string) {
    trackEvent('error', { message, stack })
}

/**
 * 获取统计摘要
 */
export function getAnalyticsSummary(): Record<string, number> {
    if (typeof window === 'undefined') return {}

    try {
        const events: AnalyticsEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
        const summary: Record<string, number> = {}

        events.forEach(e => {
            summary[e.type] = (summary[e.type] || 0) + 1
        })

        return summary
    } catch (e) {
        return {}
    }
}

/**
 * 清空统计数据
 */
export function clearAnalytics() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
}
