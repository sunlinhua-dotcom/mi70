'use client'

import { useEffect, useRef } from 'react'
import axios from 'axios'
import { useSession } from 'next-auth/react'

export function GlobalJobPoller() {
    const { data: session } = useSession()
    const lastCompletedCountRef = useRef<number | null>(null)

    // Helper for Toast
    const notify = (msg: string, type: any = 'success') => {
        if (typeof window !== 'undefined' && (window as any).showToast) {
            (window as any).showToast(msg, type)
        }
    }

    const triggerHaptic = () => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate([20, 50, 20])
        }
    }

    useEffect(() => {
        if (!session?.user) return

        const checkJobs = async () => {
            try {
                const res = await axios.get('/api/jobs')
                if (res.data.success) {
                    const jobs = res.data.jobs || []
                    const completedCount = jobs.filter((j: any) => j.status === 'COMPLETED').length

                    // Initial load
                    if (lastCompletedCountRef.current === null) {
                        lastCompletedCountRef.current = completedCount
                        return
                    }

                    // Check for new completions
                    if (completedCount > lastCompletedCountRef.current) {
                        const newCount = completedCount - lastCompletedCountRef.current
                        triggerHaptic()
                        notify(`🎉 ${newCount} 个创作任务已完成！`, 'success')
                        lastCompletedCountRef.current = completedCount
                    }
                }
            } catch (e) {
                // Silent catch for background polling
            }
        }

        const interval = setInterval(checkJobs, 10000)
        return () => clearInterval(interval)
    }, [session])

    return null
}
