'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Clock, CheckCircle, Loader2, Download, Trash2, History as HistoryIcon } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import { motion } from 'framer-motion'

interface Job {
    id: string
    style: string
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    originalData?: string
    resultUrl?: string
    resultData?: string
    errorMessage?: string
    createdAt: string
    aspectRatio?: string
}

export default function HistoryPage() {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)

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
        try {
            await axios.post('/api/jobs/process', {}, {
                headers: { 'x-process-key': 'internal-job-processor' },
                timeout: 180000
            })
            await loadJobs()
        } catch (e) {
            console.error('Process error')
        }
    }

    const downloadImage = async (url?: string, base64?: string, index?: number) => {
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)

        if (base64) {
            const byteString = atob(base64)
            const ab = new ArrayBuffer(byteString.length)
            const ia = new Uint8Array(ab)
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i)
            }
            const blob = new Blob([ab], { type: 'image/jpeg' })

            if (isIOS && navigator.share) {
                try {
                    const file = new File([blob], `mi70_${Date.now()}.jpg`, { type: 'image/jpeg' })
                    await navigator.share({ files: [file] })
                    return
                } catch (e) {
                    console.log('Share cancelled or failed, falling back')
                }
            }

            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `mi70_${Date.now()}.jpg`
            a.click()
            URL.revokeObjectURL(a.href)
        } else if (url) {
            window.open(url, '_blank')
        }
    }

    const deleteJob = async (id: string) => {
        if (!confirm('确定要删除这条记录吗？')) return
        try {
            await axios.delete(`/api/jobs?id=${id}`)
            setJobs(prev => prev.filter(j => j.id !== id))
        } catch (e) {
            console.error('Failed to delete job')
            alert('删除失败，请重试')
        }
    }

    useEffect(() => {
        loadJobs()
        const interval = setInterval(loadJobs, 10000)
        return () => clearInterval(interval)
    }, [])

    const pendingJobs = jobs.filter(j => j.status === 'PENDING' || j.status === 'PROCESSING')
    const completedJobs = jobs.filter(j => j.status === 'COMPLETED')

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
                    <div style={{ width: '60px' }} /> {/* Spacer for centering */}
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
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {pendingJobs.map(job => (
                                        <div key={job.id} style={{ padding: '12px 16px', borderRadius: '12px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Loader2 size={14} color="#D4AF37" style={{ animation: 'spin 1s linear infinite' }} />
                                            <span style={{ color: '#888', fontSize: '12px' }}>{job.style}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Completed Jobs */}
                        {completedJobs.length > 0 && (
                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <CheckCircle size={14} color="#4CAF50" />
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>已完成 ({completedJobs.length})</span>
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
                                            {/* Before / After */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '160px' }}>
                                                {/* Before */}
                                                <div style={{ position: 'relative', background: '#0a0a0a' }}>
                                                    {job.originalData ? (
                                                        <img
                                                            src={`data:image/jpeg;base64,${job.originalData}`}
                                                            alt="原图"
                                                            style={{ width: '100%', height: '160px', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>无原图</div>
                                                    )}
                                                    <span style={{ position: 'absolute', top: 8, left: 8, fontSize: '9px', background: 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: '4px', color: '#888' }}>原图</span>
                                                </div>
                                                {/* After */}
                                                <div style={{ position: 'relative', background: '#0a0a0a' }}>
                                                    <img
                                                        src={job.resultData ? `data:image/jpeg;base64,${job.resultData}` : job.resultUrl}
                                                        alt="效果图"
                                                        onClick={() => downloadImage(job.resultUrl, job.resultData, idx)}
                                                        style={{ width: '100%', height: '160px', objectFit: 'cover', cursor: 'pointer' }}
                                                    />
                                                    <span style={{ position: 'absolute', top: 8, right: 8, fontSize: '9px', background: 'rgba(76,175,80,0.8)', padding: '3px 8px', borderRadius: '4px', color: '#fff' }}>完成</span>
                                                    <button
                                                        onClick={() => deleteJob(job.id)}
                                                        style={{ position: 'absolute', bottom: 8, left: 8, width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ff4d4f' }}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => downloadImage(job.resultUrl, job.resultData, idx)}
                                                        style={{ position: 'absolute', bottom: 8, right: 8, width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(212,175,55,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                    >
                                                        <Download size={12} color="#D4AF37" />
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Footer */}
                                            <div style={{ padding: '12px 14px', borderTop: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: '12px', color: '#fff', fontWeight: 500 }}>{job.style}</div>
                                                    <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{job.aspectRatio || '1:1'}</div>
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#555' }}>
                                                    {new Date(job.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
            <style jsx global>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
