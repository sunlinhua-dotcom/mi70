'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, CheckCircle, Loader2, Download, Trash2, History as HistoryIcon, SlidersHorizontal, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { ImageCompareSlider } from '@/components/ImageCompareSlider'

interface Job {
    id: string
    style: string
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    originalData?: string
    originalUrl?: string  // R2 Direct URL
    resultUrl?: string    // R2 Direct URL
    resultData?: string
    errorMessage?: string
    createdAt: string
    aspectRatio?: string
}

function ProcessingTips() {
    const tips = [
        "正在捕捉食材的天然光泽...",
        "正在雕琢米其林级别的视觉构图...",
        "正在为画面注入主厨的艺术灵魂...",
        "正在计算 8K 级别的精细纹理...",
        "正在优化光影，营造高级电影感...",
        "AI 正在对每一处像素进行艺术重构...",
        "即将完成这份光影盛宴..."
    ]
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex(i => (i + 1) % tips.length)
        }, 2000)
        return () => clearInterval(timer)
    }, [tips.length])

    return (
        <motion.span
            key={index}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'block', minHeight: '1.5em' }}
        >
            {tips[index]}
        </motion.span>
    )
}

function ScanningLine() {
    return (
        <motion.div
            initial={{ top: '0%' }}
            animate={{ top: '100%' }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
            }}
            style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
                boxShadow: '0 0 15px #D4AF37',
                zIndex: 20,
                pointerEvents: 'none'
            }}
        />
    )
}

function SimulatedProgress({ status }: { status: string }) {
    const [progress, setProgress] = useState(status === 'PENDING' ? 5 : 15)

    useEffect(() => {
        if (status === 'PENDING') return

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 98) return 98 // Cap at 98%
                const step = prev < 60 ? 1 : (prev < 90 ? 0.3 : 0.05)
                return prev + step
            })
        }, 150)

        return () => clearInterval(interval)
    }, [status])

    return (
        <div style={{ width: '100%', marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#D4AF37', fontWeight: 600 }}>{status === 'PROCESSING' ? 'AI 正在全力重绘...' : '排队中...'}</span>
                <span style={{ fontSize: '12px', color: '#D4AF37', fontVariantNumeric: 'tabular-nums' }}>{Math.floor(progress)}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, #D4AF37, #AA8C2C)', boxShadow: '0 0 10px rgba(212,175,55,0.5)' }}
                />
            </div>
        </div>
    )
}

function ImageWithSkeleton({ src, alt, className, style, onClick }: { src: string, alt: string, className?: string, style?: React.CSSProperties, onClick?: () => void }) {
    const [loaded, setLoaded] = useState(false)
    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            {!loaded && (
                <div className="skeleton-shimmer" style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite linear'
                }} />
            )}
            <img
                src={src}
                alt={alt}
                className={className}
                style={{ ...style, opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
                onLoad={() => setLoaded(true)}
                onError={(e) => {
                    const img = e.currentTarget;
                    // Fallback logic for thumbnails
                    if (img.src.includes('_thumb.jpg')) {
                        console.log('Thumbnail (R2) failed, falling back to original');
                        img.src = img.src.replace('_thumb.jpg', '.jpg');
                    } else if (img.src.includes('type=thumb')) {
                        console.log('Thumbnail (API) failed, falling back to original');
                        img.src = img.src.replace('type=thumb', 'type=original');
                    } else {
                        img.style.display = 'none';
                    }
                }}
                onClick={onClick}
            />
        </div>
    )
}

export default function HistoryPage() {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [compareMode, setCompareMode] = useState(false)
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const router = useRouter()

    // Helper: Get thumbnail URL from original R2 URL
    const getThumbUrl = (url?: string) => {
        if (!url) return url
        if (url.startsWith('http') && !url.includes('_thumb.jpg')) {
            return url.replace('.jpg', '_thumb.jpg')
        }
        if (url.includes('/api/images') && url.includes('type=original')) {
            return url.replace('type=original', 'type=thumb')
        }
        return url
    }

    // Helper for Toast
    const notify = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
        if (typeof window !== 'undefined' && (window as unknown as { showToast: (m: string, t: string) => void }).showToast) {
            (window as unknown as { showToast: (m: string, t: string) => void }).showToast(msg, type)
        }
    }

    // Helper for Haptic
    const triggerHaptic = () => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(10)
        }
    }

    // Check for optimistic pending jobs from localStorage
    const getOptimisticJobs = (): Job[] => {
        if (typeof window === 'undefined') return []
        try {
            const stored = localStorage.getItem('mi70_pending_jobs')
            if (stored) {
                const parsed = JSON.parse(stored) as Job[]
                // Only return jobs submitted within last 5 minutes
                const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
                return parsed.filter(j => new Date(j.createdAt).getTime() > fiveMinutesAgo)
            }
        } catch { /* ignore */ }
        return []
    }

    const loadJobs = async (page = currentPage) => {
        try {
            const res = await axios.get(`/api/jobs?page=${page}&limit=15`)
            if (res.data.success) {
                const serverJobs = res.data.jobs as Job[]
                setHasMore(res.data.hasMore)
                // Only merge optimistic jobs on the first page
                const optimistic = page === 1 ? getOptimisticJobs() : []
                const merged = [...serverJobs]

                let storageUpdated = false
                const remainingOptimistic = [...optimistic]

                optimistic.forEach(opt => {
                    const isReflected = serverJobs.some(s =>
                        s.style === opt.style &&
                        Math.abs(new Date(s.createdAt).getTime() - new Date(opt.createdAt).getTime()) < 45000
                    )

                    if (!isReflected) {
                        merged.unshift(opt)
                    } else {
                        const idx = remainingOptimistic.findIndex(o => o.id === opt.id)
                        if (idx !== -1) {
                            remainingOptimistic.splice(idx, 1)
                            storageUpdated = true
                        }
                    }
                })

                if (storageUpdated) {
                    localStorage.setItem('mi70_pending_jobs', JSON.stringify(remainingOptimistic))
                }

                setJobs(merged)
            }
        } catch {
            console.error('Failed to load jobs')
        } finally {
            setLoading(false)
        }
    }

    // Initial load and dynamic polling
    useEffect(() => {
        const optimistic = getOptimisticJobs()
        if (optimistic.length > 0) {
            setJobs(optimistic)
            setLoading(false)
        }

        loadJobs()

        // Poll every 3s if there are pending jobs, else 10s
        const getInterval = () => {
            const currentOptimistic = getOptimisticJobs()
            const hasPending = currentOptimistic.length > 0
            return hasPending ? 3000 : 10000
        }

        let intervalTime = getInterval()
        let timer = setInterval(loadJobs, intervalTime)

        const checkInterval = setInterval(() => {
            const newInterval = getInterval()
            if (newInterval !== intervalTime) {
                clearInterval(timer)
                intervalTime = newInterval
                timer = setInterval(loadJobs, intervalTime)
            }
        }, 3000)

        return () => {
            clearInterval(timer)
            clearInterval(checkInterval)
        }
    }, [currentPage])

    const processingRef = useRef(false)

    const handleProcessNow = async () => {
        if (processingRef.current) return
        processingRef.current = true
        setProcessing(true)
        triggerHaptic()
        notify('⏳ AI 正在绘制中...', 'info')
        try {
            await axios.post('/api/jobs/process', {}, {
                headers: { 'x-process-key': 'internal-job-processor' },
                timeout: 180000
            })
            await loadJobs()
            notify('✨ 绘制完成！')
        } catch {
            notify('处理失败，请稍后重试', 'error')
        } finally {
            processingRef.current = false
            setProcessing(false)
        }
    }

    // Auto-trigger processing when pending jobs are detected
    useEffect(() => {
        const hasPending = jobs.some(j => j.status === 'PENDING');
        if (hasPending && !processingRef.current) {
            console.log('[AutoProcess] Pending jobs detected, triggering...');
            handleProcessNow();
        }
    }, [jobs])

    const downloadImage = async (url?: string, base64?: string, index?: number) => {
        triggerHaptic()
        notify('请求下载中...', 'info')
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
        let blob: Blob | null = null

        if (base64) {
            const byteString = atob(base64)
            const ab = new ArrayBuffer(byteString.length)
            const ia = new Uint8Array(ab)
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i)
            }
            blob = new Blob([ab], { type: 'image/jpeg' })
        } else if (url && (url.startsWith('/api/images') || url.startsWith('http'))) {
            try {
                const res = await fetch(url)
                if (res.ok) {
                    blob = await res.blob()
                }
            } catch (e) {
                console.error('Fetch image failed', e)
            }
        }

        if (blob) {
            if (isIOS && navigator.share) {
                try {
                    const file = new File([blob], `mi70_${Date.now()}.jpg`, { type: 'image/jpeg' })
                    await navigator.share({ files: [file] })
                    return
                } catch (e) {
                    console.log('Share cancelled or failed')
                }
            }

            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `mi70_${Date.now()}.jpg`
            a.click()
            URL.revokeObjectURL(a.href)
            notify('保存成功')
            return
        }

        if (url) {
            window.open(url, '_blank')
        }
    }

    const deleteJob = async (id: string) => {
        if (!confirm('确定要删除这条记录吗？')) return
        triggerHaptic()
        try {
            await axios.delete(`/api/jobs?id=${id}`)
            setJobs(prev => prev.filter(j => j.id !== id))
            notify('已成功删除')
        } catch (e) {
            notify('删除失败', 'error')
        }
    }

    // [REMOVED] Duplicate useEffect - logic consolidated in line 178

    const pendingJobs = jobs.filter(j => j.status === 'PENDING' || j.status === 'PROCESSING')
    const completedJobs = jobs.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).filter(j => j.status === 'COMPLETED')

    return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', padding: '20px' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <button
                        onClick={() => router.back()}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                        <ArrowLeft size={18} />
                        <span style={{ fontSize: '14px' }}>返回</span>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <HistoryIcon size={20} color="#D4AF37" />
                        <span style={{ fontSize: '18px', fontWeight: 600, color: '#D4AF37' }}>历史记录</span>
                    </div>
                    {pendingJobs.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                background: 'rgba(212,175,55,0.9)',
                                color: '#000',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 12px rgba(212,175,55,0.4)'
                            }}
                        >
                            <Loader2 size={12} className="animate-spin" />
                            {pendingJobs.some(j => j.status === 'PROCESSING') ? 'AI 重绘中' : '排队中'}
                        </motion.div>
                    )}
                    <div style={{ width: 'auto', minWidth: '40px' }} />
                </div>

                {loading ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            textAlign: 'center',
                            padding: '80px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '24px'
                        }}
                    >
                        <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: '50%',
                                    border: '2px solid transparent',
                                    borderTopColor: '#D4AF37',
                                    borderRightColor: 'rgba(212,175,55,0.2)'
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                color: '#D4AF37',
                                fontWeight: 'bold'
                            }}>
                                <Loader2 size={24} style={{ margin: 'auto', opacity: 0.5 }} className="rotate-infinite" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: '#D4AF37', letterSpacing: '1px' }}>
                                MI70 艺术珍藏
                            </div>
                            <div style={{ fontSize: '14px', color: '#888', maxWidth: '200px', margin: '0 auto', lineHeight: '1.6' }}>
                                正在为您跨越时空，调取每一份匠心独运的美食档案...
                            </div>
                        </div>

                        {/* Loading stage hints */}
                        <div style={{
                            marginTop: '10px',
                            display: 'flex',
                            gap: '12px',
                            fontSize: '11px',
                            color: '#555'
                        }}>
                            <span style={{ color: '#D4AF37' }}>● 连接私有云</span>
                            <span>○ 检索元数据</span>
                            <span>○ 渲染画廊</span>
                        </div>
                    </motion.div>
                ) : jobs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 20px', color: '#444' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'rgba(212,175,55,0.05)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
                        }}>
                            <HistoryIcon size={32} color="#D4AF37" style={{ opacity: 0.5 }} />
                        </div>
                        <div style={{ fontSize: '16px', color: '#888', fontWeight: 500, marginBottom: '8px' }}>灵感画廊空无一物</div>
                        <div style={{ fontSize: '13px', color: '#555', marginBottom: '32px' }}>您的每一次快门，都值得被重塑为艺术</div>
                        <Link href="/" style={{
                            display: 'inline-block',
                            padding: '12px 32px',
                            background: 'linear-gradient(135deg, #D4AF37, #B8860B)',
                            borderRadius: '30px',
                            color: '#000',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            fontSize: '14px',
                            boxShadow: '0 10px 20px rgba(212,175,55,0.2)'
                        }}>
                            开启首份订单
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Pending Jobs */}
                        {pendingJobs.length > 0 && (
                            <section style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Clock size={14} color="#D4AF37" />
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>待处理 ({pendingJobs.length})</span>
                                    </div>
                                    <button
                                        onClick={handleProcessNow}
                                        disabled={processing}
                                        style={{
                                            padding: '6px 14px',
                                            borderRadius: '14px',
                                            background: processing ? 'rgba(212,175,55,0.4)' : 'rgba(212,175,55,0.2)',
                                            border: '1px solid rgba(212,175,55,0.4)',
                                            color: '#D4AF37',
                                            fontSize: '11px',
                                            cursor: processing ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        {processing && <Loader2 size={12} className="animate-spin" />}
                                        {processing ? '处理中...' : '立即处理'}
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {pendingJobs.map(job => (
                                        <div key={job.id} style={{
                                            padding: '16px', borderRadius: '16px',
                                            background: '#111',
                                            border: '1px solid rgba(212,175,55,0.3)',
                                            display: 'flex', flexDirection: 'column', gap: '12px',
                                            animation: job.status === 'PROCESSING' ? 'pulse-gold 2s infinite ease-in-out' : 'none'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Loader2 size={16} color="#D4AF37" className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#D4AF37' }}>
                                                        {job.status === 'PROCESSING' ? 'AI 正在重绘中...' : '排队中...'}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '11px', color: '#666', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '8px' }}>
                                                    {job.style}
                                                </span>
                                            </div>

                                            <div style={{ position: 'relative', height: '260px', borderRadius: '12px', overflow: 'hidden' }}>
                                                <ImageWithSkeleton
                                                    src={job.originalUrl || `/api/images?id=${job.id}&type=original`}
                                                    alt="Original"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7, filter: job.status === 'PROCESSING' ? 'blur(2px) grayscale(0.5)' : 'blur(4px)' }}
                                                />
                                                {job.status === 'PROCESSING' && <ScanningLine />}
                                                <div style={{
                                                    position: 'absolute', inset: 0,
                                                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7))',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    padding: '0 30px', textAlign: 'center', zIndex: 10
                                                }}>
                                                    {job.status === 'PROCESSING' ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ position: 'relative' }}>
                                                                <div style={{
                                                                    width: '60px', height: '60px', borderRadius: '50%',
                                                                    border: '2px solid rgba(212,175,55,0.1)',
                                                                    borderTopColor: '#D4AF37',
                                                                    animation: 'spin 0.8s linear infinite',
                                                                }} />
                                                                <div style={{
                                                                    position: 'absolute', inset: -8,
                                                                    border: '1px solid rgba(212,175,55,0.2)',
                                                                    borderRadius: '50%',
                                                                    animation: 'spin 3s linear infinite reverse',
                                                                }} />
                                                            </div>
                                                            <div style={{ marginTop: '12px', fontSize: '15px', color: '#fff', height: '24px' }}>
                                                                <ProcessingTips />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                            <Clock size={32} color="rgba(212,175,55,0.5)" />
                                                            <span style={{ fontSize: '14px', color: '#888' }}>排队等候中...</span>
                                                        </div>
                                                    )}

                                                    <SimulatedProgress status={job.status} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Completed Jobs */}
                        {completedJobs.length > 0 && (
                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <CheckCircle size={14} color="#4CAF50" />
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>已完成 ({completedJobs.length})</span>
                                    </div>
                                    {/* View Mode Toggle */}
                                    <button
                                        onClick={() => setCompareMode(!compareMode)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '6px 12px', borderRadius: '12px',
                                            background: compareMode ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: compareMode ? '#D4AF37' : '#888',
                                            fontSize: '11px', cursor: 'pointer'
                                        }}
                                    >
                                        {compareMode ? <LayoutGrid size={12} /> : <SlidersHorizontal size={12} />}
                                        {compareMode ? '网格' : '对比'}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {completedJobs.map((job, idx) => (
                                        <motion.div
                                            key={job.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                borderRadius: '16px', overflow: 'hidden',
                                                border: '1px solid rgba(212,175,55,0.3)',
                                                background: '#111'
                                            }}
                                        >
                                            {compareMode ? (
                                                /* Compare Slider Mode */
                                                <div style={{ height: '220px' }}>
                                                    <ImageCompareSlider
                                                        beforeSrc={job.originalUrl || `/api/images?id=${job.id}&type=original`}
                                                        afterSrc={job.resultUrl || `/api/images?id=${job.id}&type=result`}
                                                    />
                                                </div>
                                            ) : (
                                                /* Grid Mode - Use thumbnails for faster loading */
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '160px' }}>
                                                    <div style={{ position: 'relative', background: '#0a0a0a' }}>
                                                        <ImageWithSkeleton
                                                            src={getThumbUrl(job.originalUrl) || `/api/images?id=${job.id}&type=original`}
                                                            alt="原图"
                                                            onClick={() => setLightboxUrl(job.originalUrl || `/api/images?id=${job.id}&type=original`)}
                                                            style={{ width: '100%', height: '160px', objectFit: 'cover', cursor: 'pointer' }}
                                                        />
                                                        <span style={{ position: 'absolute', top: 8, left: 8, fontSize: '9px', background: 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: '4px', color: '#888', zIndex: 11 }}>原图</span>
                                                    </div>
                                                    <div style={{ position: 'relative', background: '#0a0a0a' }}>
                                                        <ImageWithSkeleton
                                                            src={getThumbUrl(job.resultUrl) || `/api/images?id=${job.id}&type=result`}
                                                            alt="效果图"
                                                            onClick={() => setLightboxUrl(job.resultUrl || `/api/images?id=${job.id}&type=result`)}
                                                            style={{ width: '100%', height: '160px', objectFit: 'cover', cursor: 'pointer' }}
                                                        />
                                                        <span style={{ position: 'absolute', top: 8, right: 8, fontSize: '9px', background: 'rgba(212,175,55,0.8)', padding: '3px 8px', borderRadius: '4px', color: '#000', fontWeight: 600, zIndex: 11 }}>效果图</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Info Footer */}
                                            <div style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to right, #1a1a1a, #111)' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '13px', color: '#D4AF37', fontWeight: 600 }}>{job.style}</span>
                                                    <span style={{ fontSize: '10px', color: '#666' }}>{new Date(job.createdAt).toLocaleString()}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                    <button onClick={() => downloadImage(job.resultUrl || `/api/images?id=${job.id}&type=result`, undefined, idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                                        <Download size={16} color="#888" />
                                                    </button>
                                                    <button onClick={() => deleteJob(job.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                                        <Trash2 size={16} color="#444" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Pagination */}
                        {(hasMore || currentPage > 1) && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '20px',
                                padding: '40px 0 60px',
                            }}>
                                <button
                                    onClick={() => {
                                        if (currentPage > 1) {
                                            const newPage = currentPage - 1;
                                            setCurrentPage(newPage);
                                            triggerHaptic();
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                    }}
                                    disabled={currentPage === 1}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '12px',
                                        background: currentPage === 1 ? '#1a1a1a' : 'rgba(212,175,55,0.1)',
                                        color: currentPage === 1 ? '#444' : '#D4AF37',
                                        border: `1px solid ${currentPage === 1 ? '#222' : 'rgba(212,175,55,0.3)'}`,
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <ChevronLeft size={18} />
                                    上一页
                                </button>

                                <span style={{ color: '#666', fontSize: '14px' }}>
                                    第 <span style={{ color: '#D4AF37' }}>{currentPage}</span> 页
                                </span>

                                <button
                                    onClick={() => {
                                        if (hasMore) {
                                            const newPage = currentPage + 1;
                                            setCurrentPage(newPage);
                                            triggerHaptic();
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                    }}
                                    disabled={!hasMore}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '12px',
                                        background: !hasMore ? '#1a1a1a' : 'rgba(212,175,55,0.1)',
                                        color: !hasMore ? '#444' : '#D4AF37',
                                        border: `1px solid ${!hasMore ? '#222' : 'rgba(212,175,55,0.3)'}`,
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: !hasMore ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    下一页
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {lightboxUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightboxUrl(null)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 9999,
                            background: 'rgba(0,0,0,0.95)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px',
                            cursor: 'zoom-out'
                        }}
                    >
                        <motion.img
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            src={lightboxUrl}
                            alt="放大预览"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '80vh',
                                objectFit: 'contain',
                                borderRadius: '12px',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
                            }}
                        />

                        {/* Control Buttons */}
                        <div style={{ position: 'absolute', bottom: '100px', display: 'flex', gap: '20px' }} onClick={e => e.stopPropagation()}>
                            <button
                                onClick={async () => {
                                    try {
                                        const response = await fetch(lightboxUrl);
                                        const blob = await response.blob();
                                        const file = new File([blob], 'mi70-image.jpg', { type: 'image/jpeg' });

                                        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                                            await navigator.share({
                                                files: [file],
                                                title: '快看！我的照片被 MI70 变成米其林大片了 ✨',
                                                text: '每一份平凡的食材，在 MI70 手中都能绽放出艺术的光芒。你也来试试？',
                                                url: 'https://mi70.digirepub.com'
                                            });
                                        } else {
                                            const a = document.createElement('a');
                                            a.href = lightboxUrl;
                                            a.download = `mi70-${Date.now()}.jpg`;
                                            a.click();
                                        }
                                    } catch (err) {
                                        notify('保存失败，请直接长按图片保存', 'error');
                                    }
                                }}
                                style={{
                                    padding: '12px 28px',
                                    borderRadius: '50px',
                                    background: '#D4AF37',
                                    color: '#000',
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    boxShadow: '0 8px 25px rgba(212,175,55,0.5)',
                                    cursor: 'pointer'
                                }}
                            >
                                <Download size={20} />
                                保存到手机相册
                            </button>
                        </div>

                        <div style={{
                            position: 'absolute',
                            bottom: '40px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            color: '#aaa',
                            fontSize: '13px',
                            background: 'rgba(0,0,0,0.6)',
                            padding: '8px 20px',
                            borderRadius: '30px',
                            backdropFilter: 'blur(5px)'
                        }}>
                            点击背景退出 · 长按图片亦可直接保存
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
            @keyframes pulse-gold {
                0% { border-color: rgba(212,175,55,0.3); box-shadow: 0 0 0 rgba(212,175,55,0); scale: 1; }
                50% { border-color: rgba(212,175,55,0.8); box-shadow: 0 0 15px rgba(212,175,55,0.2); scale: 1.005; }
                100% { border-color: rgba(212,175,55,0.3); box-shadow: 0 0 0 rgba(212,175,55,0); scale: 1; }
            }
            .skeleton-shimmer { pointer-events: none; z-index: 10; }
        `}</style>
        </div>
    )
}
