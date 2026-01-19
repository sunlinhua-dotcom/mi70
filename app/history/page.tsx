'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Clock, CheckCircle, Loader2, Download, Trash2, History as HistoryIcon, SlidersHorizontal, LayoutGrid } from 'lucide-react'
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
        "正在分析食材纹理...",
        "正在调整光影布局...",
        "正在渲染米其林摆盘...",
        "正在生成高光细节...",
        "AI 正在挥洒创意..."
    ]
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex(i => (i + 1) % tips.length)
        }, 2000)
        return () => clearInterval(timer)
    }, [])

    return (
        <motion.span
            key={index}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.5 }}
        >
            {tips[index]}
        </motion.span>
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
                onClick={onClick}
                onError={(e) => (e.currentTarget.style.display = 'none')}
            />
        </div>
    )
}

export default function HistoryPage() {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [compareMode, setCompareMode] = useState(false)

    // Helper: Get thumbnail URL from original R2 URL
    const getThumbUrl = (url?: string) => {
        if (!url || !url.includes('.jpg')) return url
        return url.replace('.jpg', '_thumb.jpg')
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

    const loadJobs = async () => {
        try {
            const res = await axios.get('/api/jobs')
            if (res.data.success) {
                setJobs(res.data.jobs)
            }
        } catch (e) {
            console.error('Failed to load jobs')
        } finally {
            setLoading(false)
        }
    }

    const handleProcessNow = async () => {
        triggerHaptic()
        notify('正在开始处理任务...', 'info')
        try {
            await axios.post('/api/jobs/process', {}, {
                headers: { 'x-process-key': 'internal-job-processor' },
                timeout: 180000
            })
            await loadJobs()
            notify('任务处理完成')
        } catch (e) {
            notify('处理失败，请稍后重试', 'error')
        }
    }

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

    useEffect(() => {
        loadJobs()
        const interval = setInterval(loadJobs, 10000)
        return () => clearInterval(interval)
    }, [])

    const pendingJobs = jobs.filter(j => j.status === 'PENDING' || j.status === 'PROCESSING')
    const completedJobs = jobs.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).filter(j => j.status === 'COMPLETED')

    return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', padding: '20px' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888', textDecoration: 'none' }}>
                        <ArrowLeft size={18} />
                        <span style={{ fontSize: '14px' }}>返回</span>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <HistoryIcon size={20} color="#D4AF37" />
                        <span style={{ fontSize: '18px', fontWeight: 600, color: '#D4AF37' }}>历史记录</span>
                    </div>
                    <div style={{ width: '60px' }} />
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#444' }}>
                        <Loader2 size={24} className="animate-spin" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                        <div>加载中...</div>
                    </div>
                ) : jobs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#444' }}>
                        <HistoryIcon size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                        <div style={{ fontSize: '14px' }}>暂无历史记录</div>
                        <Link href="/" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 24px', background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: '20px', color: '#D4AF37', textDecoration: 'none', fontSize: '13px' }}>
                            去创作
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
                                    <button onClick={handleProcessNow} style={{ padding: '6px 14px', borderRadius: '14px', background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37', fontSize: '11px', cursor: 'pointer' }}>
                                        立即处理
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {pendingJobs.map(job => (
                                        <div key={job.id} style={{
                                            padding: '16px', borderRadius: '16px',
                                            background: '#111', border: '1px solid rgba(212,175,55,0.3)',
                                            display: 'flex', flexDirection: 'column', gap: '12px'
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
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, filter: 'blur(3px)' }}
                                                />
                                                <div style={{
                                                    position: 'absolute', inset: 0,
                                                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8))',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    gap: '16px', zIndex: 10
                                                }}>
                                                    <div style={{
                                                        width: '50px', height: '50px', borderRadius: '50%',
                                                        border: '4px solid rgba(212,175,55,0.3)',
                                                        borderTopColor: '#D4AF37',
                                                        animation: 'spin 1s linear infinite',
                                                        boxShadow: '0 0 20px rgba(212,175,55,0.3)'
                                                    }} />
                                                    <div style={{ fontSize: '14px', color: '#fff', fontWeight: 500, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                                        {job.status === 'PROCESSING' ? (
                                                            <ProcessingTips />
                                                        ) : (
                                                            '正在等待服务器分配算力...'
                                                        )}
                                                    </div>
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
                                                            style={{ width: '100%', height: '160px', objectFit: 'cover' }}
                                                        />
                                                        <span style={{ position: 'absolute', top: 8, left: 8, fontSize: '9px', background: 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: '4px', color: '#888', zIndex: 11 }}>原图</span>
                                                    </div>
                                                    <div style={{ position: 'relative', background: '#0a0a0a' }}>
                                                        <ImageWithSkeleton
                                                            src={getThumbUrl(job.resultUrl) || `/api/images?id=${job.id}&type=result`}
                                                            alt="效果图"
                                                            onClick={() => downloadImage(job.resultUrl || `/api/images?id=${job.id}&type=result`, undefined, idx)}
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
                    </>
                )
                }
            </div>
            <style jsx global>{`
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
            .skeleton-shimmer { pointer-events: none; z-index: 10; }
        `}</style>
        </div>
    )
}
