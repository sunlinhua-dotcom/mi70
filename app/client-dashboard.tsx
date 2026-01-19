'use client'

import { useState, useEffect, useRef } from 'react'
import { ImageUploader } from '@/components/ImageUploader'
import { StyleSelector } from '@/components/StyleSelector'
import { Upload, Camera, Zap, Check, ChevronRight, Download, RefreshCcw, LogOut, Loader2, Trash2, Sparkles, ArrowRight, ChefHat, Clock, CheckCircle, History, X } from 'lucide-react'
import axios from 'axios'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
    userCredits: number
    isSuperUser: boolean
}

interface Job {
    id: string
    style: string
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    originalData?: string // Base64
    resultUrl?: string
    resultData?: string   // Base64 (New)
    errorMessage?: string
    createdAt: string
}

async function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<File> {
    return new Promise((resolve) => {
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        img.onload = () => {
            let { width, height } = img
            if (width > maxWidth) {
                height = (height * maxWidth) / width
                width = maxWidth
            }
            canvas.width = width
            canvas.height = height
            ctx.drawImage(img, 0, 0, width, height)
            canvas.toBlob((blob) => {
                resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file)
            }, 'image/jpeg', quality)
        }
        img.src = URL.createObjectURL(file)
    })
}

export default function ClientDashboard({ userCredits, isSuperUser }: Props) {
    const [files, setFiles] = useState<File[]>([])
    const [selectedStyle, setSelectedStyle] = useState('michelin-star')
    const [aspectRatio, setAspectRatio] = useState('1:1')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [jobs, setJobs] = useState<Job[]>([])
    const [credits, setCredits] = useState(userCredits)
    const [mounted, setMounted] = useState(false)

    // Load preferences from localStorage on mount
    useEffect(() => {
        setMounted(true)
        if (typeof window !== 'undefined') {
            const savedStyle = localStorage.getItem('mi70_style')
            const savedRatio = localStorage.getItem('mi70_ratio')
            if (savedStyle) setSelectedStyle(savedStyle)
            if (savedRatio) setAspectRatio(savedRatio)
        }
    }, [])

    // Save preferences when changed
    useEffect(() => {
        if (mounted && typeof window !== 'undefined') {
            localStorage.setItem('mi70_style', selectedStyle)
            localStorage.setItem('mi70_ratio', aspectRatio)
        }
    }, [selectedStyle, aspectRatio, mounted])

    // Helper for Toast
    const notify = (msg: string, type: any = 'success') => {
        if (typeof window !== 'undefined' && (window as any).showToast) {
            (window as any).showToast(msg, type)
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
                setCredits(res.data.credits)
            }
        } catch (e) {
            console.error('Failed to load jobs')
        }
    }

    const processPendingJobs = async () => {
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

    useEffect(() => {
        loadJobs()
        const interval = setInterval(loadJobs, 10000)
        return () => clearInterval(interval)
    }, [])

    const handleSubmit = async () => {
        if (!selectedStyle || files.length === 0) return
        triggerHaptic()
        setIsSubmitting(true)

        // Immediately show feedback
        notify(`🚀 正在上传 ${files.length} 张图片...`, 'info')

        const filesToProcess = [...files]
        setFiles([])

        // Start upload in background and redirect immediately
        const uploadPromises = filesToProcess.map(async (file) => {
            try {
                const compressed = await compressImage(file, 800, 0.7)
                const formData = new FormData()
                formData.append('file', compressed)
                formData.append('style', selectedStyle)
                formData.append('aspectRatio', aspectRatio)
                await axios.post('/api/jobs', formData)
                return true
            } catch (e) {
                console.error('Submit failed')
                return false
            }
        })

        // Redirect to history immediately (don't wait for all uploads)
        setTimeout(() => {
            window.location.href = '/history'
        }, 500)

        // Continue uploads in background
        Promise.all(uploadPromises).then((results) => {
            const successCount = results.filter(Boolean).length
            console.log(`[Upload] ${successCount}/${filesToProcess.length} uploaded`)
        })
    }

    const handleProcessNow = async () => {
        triggerHaptic()
        notify('⏳ 正在处理...', 'info')
        await processPendingJobs()
    }

    const downloadImage = async (url: string | undefined, data: string | undefined, index: number) => {
        try {
            let blob: Blob
            let filename = `mi70_${index + 1}.jpg`

            if (data) {
                // Convert Base64 to Blob
                const byteCharacters = atob(data)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                blob = new Blob([byteArray], { type: 'image/jpeg' })
            } else if (url) {
                const response = await fetch(url)
                blob = await response.blob()
            } else {
                return
            }

            // Check if Web Share API is supported and we are on mobile (trying to target iOS/Android save)
            // Note: navigator.share with files payload requires SSL context
            if (navigator.share && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                try {
                    const file = new File([blob], filename, { type: 'image/jpeg' })
                    await navigator.share({
                        files: [file],
                        title: 'MI70 Food Art',
                    })
                    return // Share successful, exit 
                } catch (shareError) {
                    console.log('Share failed or cancelled, falling back to download', shareError)
                    // Fallback to normal download if share fails (e.g. user cancelled)
                }
            }

            // Standard/Desktop Download
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = filename
            link.click()
        } catch (e) {
            console.error('Download failed', e)
            if (url) window.open(url, '_blank')
        }
    }

    const deleteJob = async (id: string) => {
        if (!confirm('确定要删除这条记录吗？')) return
        try {
            await axios.delete(`/api/jobs?id=${id}`)
            // Optimistic update or reload
            setJobs(prev => prev.filter(j => j.id !== id))
        } catch (e) {
            console.error('Failed to delete job')
            alert('删除失败，请重试')
        }
    }

    const cost = files.length
    const canSubmit = files.length > 0 && !!selectedStyle && (isSuperUser || credits >= cost)

    if (!mounted) return null

    const RATIOS = [
        { id: '1:1', label: '1:1' },
        { id: '3:4', label: '3:4' },
        { id: '4:3', label: '4:3' },
        { id: '9:16', label: '9:16' }
    ]

    return (
        <div style={{ paddingBottom: '120px', paddingTop: '16px' }}>
            <Link
                href="/history"
                style={{
                    position: 'fixed', top: '70px', right: '16px', zIndex: 100,
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '20px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#aaa',
                    fontSize: '12px', fontWeight: 500, textDecoration: 'none',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    cursor: 'pointer'
                }}
            >
                <History size={14} />
                历史记录
                {jobs.length > 0 && (
                    <span style={{
                        background: '#D4AF37', color: '#000', fontSize: '10px', fontWeight: 700,
                        padding: '2px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center'
                    }}>{jobs.length}</span>
                )}
            </Link>

            {/* Upload */}
            <section style={{ marginBottom: '24px' }}>
                <ImageUploader files={files} onFilesChange={setFiles} />
            </section>

            {/* Ratios - Simplified Segmented Control */}
            <section style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ color: '#555', fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px' }}>输出比例</span>
                </div>
                <div style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '4px',
                }}>
                    {RATIOS.map(ratio => (
                        <button
                            key={ratio.id}
                            onClick={() => { triggerHaptic(); setAspectRatio(ratio.id); }}
                            style={{
                                flex: 1,
                                padding: '8px 0',
                                borderRadius: '8px',
                                border: 'none',
                                background: aspectRatio === ratio.id ? 'rgba(212,175,55,0.2)' : 'transparent',
                                color: aspectRatio === ratio.id ? '#D4AF37' : '#666',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {ratio.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Styles */}
            <section style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#555', fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px' }}>选择风格</span>
                    <span style={{ color: '#D4AF37', fontSize: '9px' }}>10 种风格</span>
                </div>
                <StyleSelector selectedStyle={selectedStyle} onSelect={(s) => { triggerHaptic(); setSelectedStyle(s); }} />
            </section>

            {/* Submit Button */}
            <div style={{ position: 'fixed', bottom: '24px', left: '20px', right: '20px', zIndex: 50, display: 'flex', justifyContent: 'center' }}>
                {!canSubmit && files.length > 0 && !isSuperUser && credits < cost ? (
                    <Link href="/recharge" style={{ width: '100%', maxWidth: '320px', textDecoration: 'none' }}>
                        <button style={{ width: '100%', height: '52px', borderRadius: '26px', background: 'transparent', border: '1px solid #D4AF37', color: '#D4AF37', fontWeight: 600, fontSize: '13px' }}>余额不足 · 立即充值</button>
                    </Link>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit || isSubmitting}
                        style={{
                            width: '100%', maxWidth: '320px', height: '52px', borderRadius: '26px',
                            background: canSubmit && !isSubmitting ? 'linear-gradient(135deg, #D4AF37 0%, #B8962E 50%, #D4AF37 100%)' : '#222',
                            border: 'none',
                            boxShadow: canSubmit && !isSubmitting ? '0 4px 20px rgba(212,175,55,0.4)' : 'none',
                            color: canSubmit && !isSubmitting ? '#000' : '#555', fontWeight: 700, fontSize: '14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            cursor: canSubmit && !isSubmitting ? 'pointer' : 'not-allowed', opacity: canSubmit ? 1 : 0.6
                        }}
                    >
                        {isSubmitting ? <><Loader2 size={16} className="animate-spin" />提交中...</> : <><Sparkles size={16} fill={canSubmit ? "#000" : "#555"} />提交任务 {files.length > 0 && `(${files.length}张)`}</>}
                    </button>
                )}
            </div>

            <style jsx global>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
