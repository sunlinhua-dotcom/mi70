'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ImageUploader } from '@/components/ImageUploader'

// Lazy load StyleSelector to speed up initial page render
const StyleSelector = dynamic(() => import('@/components/StyleSelector').then(mod => mod.StyleSelector), {
    ssr: false,
    loading: () => <div className="h-48 w-full bg-white/5 animate-pulse rounded-xl" />
})
import { Loader2, Sparkles, History, Upload } from 'lucide-react'
import axios from 'axios'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { compressImage } from '@/lib/client-compression'

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



export default function ClientDashboard({ userCredits, isSuperUser }: Props) {
    const router = useRouter()
    const [files, setFiles] = useState<File[]>([])
    const [selectedStyle, setSelectedStyle] = useState('michelin-star')
    const [aspectRatio, setAspectRatio] = useState('1:1')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [envFile, setEnvFile] = useState<File | null>(null) // Environment file state
    const [jobs, setJobs] = useState<Job[]>([])
    const [credits, setCredits] = useState(userCredits)
    const [mounted, setMounted] = useState(false)


    // Upload State
    const [uploadProgress, setUploadProgress] = useState(0)
    const [currentFileIndex, setCurrentFileIndex] = useState(0)
    const [submissionStatus, setSubmissionStatus] = useState('')



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

    const loadJobs = useCallback(async () => {
        try {
            const res = await axios.get('/api/jobs')
            if (res.data.success) {
                setJobs(res.data.jobs)
                setCredits(res.data.credits)
            }
        } catch {
            console.error('Failed to load jobs')
        }
    }, [])



    useEffect(() => {
        loadJobs()
        const interval = setInterval(loadJobs, 10000)
        return () => clearInterval(interval)
    }, [loadJobs])

    const handleSubmit = async () => {
        if (!selectedStyle || files.length === 0) return

        setIsSubmitting(true)
        setCurrentFileIndex(0)
        setUploadProgress(0) // Reset progress

        const filesToProcess = [...files]
        const totalFiles = filesToProcess.length
        triggerHaptic()

        // Don't clear files yet, wait for success
        // Don't push router yet

        for (let i = 0; i < totalFiles; i++) {
            const file = filesToProcess[i]
            setCurrentFileIndex(i + 1)
            setUploadProgress(0)

            try {
                setSubmissionStatus(envFile && selectedStyle === 'custom-shop' ? '正在压缩双图...' : '正在压缩图片...')
                // Give UI a moment to update
                await new Promise(r => setTimeout(r, 100))

                const compressedMain = await compressImage(file, 1200, 0.8)
                const formData = new FormData()
                formData.append('file', compressedMain)

                if (selectedStyle === 'custom-shop') {
                    if (!envFile) {
                        notify('请上传店铺环境图', 'error')
                        setIsSubmitting(false)
                        return
                    }
                    setSubmissionStatus('正在压缩图片 (2/2)...')
                    const compressedEnv = await compressImage(envFile, 1200, 0.8)
                    formData.append('envFile', compressedEnv)
                } else {
                    formData.append('envFile', '') // Ensure envFile is always present, even if empty
                }

                formData.append('style', selectedStyle)
                formData.append('aspectRatio', aspectRatio)

                setSubmissionStatus('正在加密传输...')

                await axios.post('/api/jobs', formData, {
                    onUploadProgress: (p) => {
                        const percent = Math.round((p.loaded * 100) / (p.total || 100))
                        setUploadProgress(percent)
                        if (percent === 100) setSubmissionStatus('服务器接收成功...')
                    }
                })

            } catch (err) {
                console.error('Submit failed', err)
                notify('上传中断，请检查网络', 'error')
                setIsSubmitting(false)
                return
            }
        }

        // All done
        setSubmissionStatus('上传完成，前往任务中心...')
        setUploadProgress(100)
        triggerHaptic()

        // Give a brief moment for the user to see "100%"
        setTimeout(() => {
            setFiles([])
            setEnvFile(null)
            router.push('/history')
        }, 500)
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

                {/* Environment Image Upload for Custom Shop */}
                {selectedStyle === 'custom-shop' && (
                    <div
                        onClick={() => document.getElementById('env-upload')?.click()}
                        style={{
                            marginTop: '12px',
                            width: '100%',
                            height: '100px',
                            border: '1px dashed #D4AF37',
                            borderRadius: '16px',
                            background: envFile ? `url(${URL.createObjectURL(envFile)}) center/cover no-repeat` : 'rgba(212,175,55,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <input
                            id="env-upload"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    setEnvFile(e.target.files[0])
                                    triggerHaptic()
                                }
                            }}
                        />
                        {!envFile && (
                            <>
                                <Upload size={20} color="#D4AF37" style={{ marginBottom: '8px' }} />
                                <div style={{ fontSize: '12px', color: '#888' }}>
                                    上传店铺环境图<br />
                                    <span style={{ fontSize: '10px', color: '#555' }}>(定制背景)</span>
                                </div>
                            </>
                        )}
                        {envFile && (
                            <div style={{
                                position: 'absolute',
                                background: 'rgba(0,0,0,0.6)',
                                padding: '4px 8px',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '10px'
                            }}>
                                点击更换环境图
                            </div>
                        )}
                    </div>
                )}
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

            {/* Upload Progress Overlay */}
            <AnimatePresence>
                {isSubmitting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9999,
                            background: 'rgba(0,0,0,0.9)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            padding: '40px'
                        }}
                    >
                        <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '30px' }}>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                style={{
                                    width: '100%', height: '100%',
                                    borderRadius: '50%',
                                    border: '3px solid transparent',
                                    borderTopColor: '#D4AF37',
                                    borderRightColor: '#D4AF37'
                                }}
                            />
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: '#D4AF37' }}>
                                {uploadProgress}%
                            </div>
                        </div>

                        <h2 style={{ color: '#fff', fontSize: '18px', marginBottom: '8px', fontWeight: 600 }}>
                            正在上传 ({currentFileIndex}/{files.length})
                        </h2>
                        <p style={{ color: '#888', fontSize: '14px', marginBottom: '40px' }}>
                            {submissionStatus}
                        </p>

                        <div style={{
                            background: 'rgba(212,175,55,0.1)',
                            border: '1px solid rgba(212,175,55,0.3)',
                            padding: '12px 20px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4d4f', boxShadow: '0 0 5px #ff4d4f' }} className="animate-pulse" />
                            <span style={{ color: '#bbb', fontSize: '12px' }}>
                                为防止数据丢失，<span style={{ color: '#fff', fontWeight: 'bold' }}>请勿关闭或刷新页面</span>
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
