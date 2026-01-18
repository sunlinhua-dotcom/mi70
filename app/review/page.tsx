'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Upload, Image as ImageIcon, Sparkles, Copy, Check, Loader2, X, Plus } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'

interface ShopInfo {
    shopType: string
    keywords: string
    priceRange: string
}

interface HistoryImage {
    id: string
    originalData: string
}

export default function ReviewPage() {
    const [shopScreenshot, setShopScreenshot] = useState<string | null>(null)
    const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null)
    const [analyzing, setAnalyzing] = useState(false)

    const [historyImages, setHistoryImages] = useState<HistoryImage[]>([])
    const [selectedImages, setSelectedImages] = useState<string[]>([])
    const [newImages, setNewImages] = useState<string[]>([])

    const [generating, setGenerating] = useState(false)
    const [reviews, setReviews] = useState<string[]>([])
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

    const shopInputRef = useRef<HTMLInputElement>(null)
    const foodInputRef = useRef<HTMLInputElement>(null)

    // 加载历史图片
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const res = await axios.get('/api/jobs')
                if (res.data.success) {
                    const images = res.data.jobs
                        .filter((j: any) => j.originalData)
                        .map((j: any) => ({ id: j.id, originalData: j.originalData }))
                    setHistoryImages(images)
                }
            } catch (e) {
                console.error('Failed to load history')
            }
        }
        loadHistory()
    }, [])

    // 上传商家截图
    const handleShopUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (ev) => {
            const base64 = (ev.target?.result as string).split(',')[1]
            setShopScreenshot(base64)
            setAnalyzing(true)

            try {
                const res = await axios.post('/api/review', {
                    action: 'analyze',
                    shopScreenshot: base64
                })
                if (res.data.success) {
                    setShopInfo(res.data.shopInfo)
                }
            } catch (e) {
                console.error('Analyze failed')
                alert('分析失败，请重试')
            } finally {
                setAnalyzing(false)
            }
        }
        reader.readAsDataURL(file)
    }

    // 上传新菜品图
    const handleFoodUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        Array.from(files).forEach(file => {
            const reader = new FileReader()
            reader.onload = (ev) => {
                const base64 = (ev.target?.result as string).split(',')[1]
                setNewImages(prev => [...prev, base64])
            }
            reader.readAsDataURL(file)
        })
    }

    // 切换选择历史图片
    const toggleHistoryImage = (id: string, base64: string) => {
        if (selectedImages.includes(base64)) {
            setSelectedImages(prev => prev.filter(img => img !== base64))
        } else {
            setSelectedImages(prev => [...prev, base64])
        }
    }

    // 生成点评
    const handleGenerate = async () => {
        const allImages = [...selectedImages, ...newImages]
        if (!shopInfo || allImages.length === 0) {
            alert('请先上传商家截图和选择菜品图片')
            return
        }

        setGenerating(true)
        setReviews([])

        try {
            const res = await axios.post('/api/review', {
                action: 'generate',
                shopInfo,
                foodImages: allImages
            })
            if (res.data.success) {
                setReviews(res.data.reviews)
            }
        } catch (e) {
            console.error('Generate failed')
            alert('生成失败，请重试')
        } finally {
            setGenerating(false)
        }
    }

    // 复制文案
    const copyReview = async (text: string, index: number) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedIndex(index)
            setTimeout(() => setCopiedIndex(null), 2000)
        } catch (e) {
            alert('复制失败')
        }
    }

    const allSelectedCount = selectedImages.length + newImages.length

    return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', padding: '20px' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888', textDecoration: 'none' }}>
                        <ArrowLeft size={18} />
                        <span style={{ fontSize: '14px' }}>返回</span>
                    </Link>
                    <span style={{ fontSize: '18px', fontWeight: 600, color: '#D4AF37' }}>大众点评文案</span>
                    <div style={{ width: '60px' }} />
                </div>

                {/* Step 1: 上传商家截图 */}
                <section style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ background: '#D4AF37', color: '#000', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>1</span>
                        上传商家详情截图
                    </div>

                    <input ref={shopInputRef} type="file" accept="image/*" onChange={handleShopUpload} style={{ display: 'none' }} />

                    {!shopScreenshot ? (
                        <button
                            onClick={() => shopInputRef.current?.click()}
                            style={{
                                width: '100%', height: '120px', borderRadius: '12px',
                                border: '2px dashed #333', background: '#0a0a0a',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                cursor: 'pointer', color: '#666'
                            }}
                        >
                            <Upload size={24} />
                            <span style={{ fontSize: '13px' }}>点击上传大众点评商家详情页截图</span>
                        </button>
                    ) : (
                        <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #222' }}>
                            <img src={`data:image/jpeg;base64,${shopScreenshot}`} alt="商家截图" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
                            <button
                                onClick={() => { setShopScreenshot(null); setShopInfo(null) }}
                                style={{ position: 'absolute', top: 8, right: 8, width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {/* AI 识别结果 */}
                    {analyzing && (
                        <div style={{ marginTop: '12px', padding: '16px', background: '#111', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Loader2 size={16} color="#D4AF37" style={{ animation: 'spin 1s linear infinite' }} />
                            <span style={{ fontSize: '13px', color: '#888' }}>AI 正在识别商家信息...</span>
                        </div>
                    )}

                    {shopInfo && !analyzing && (
                        <div style={{ marginTop: '12px', padding: '16px', background: '#111', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.3)' }}>
                            <div style={{ fontSize: '10px', color: '#D4AF37', marginBottom: '10px', letterSpacing: '1px' }}>AI 识别结果</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                                <div><span style={{ color: '#666' }}>店铺类型：</span><span style={{ color: '#fff' }}>{shopInfo.shopType}</span></div>
                                <div><span style={{ color: '#666' }}>特色关键词：</span><span style={{ color: '#fff' }}>{shopInfo.keywords}</span></div>
                                <div><span style={{ color: '#666' }}>人均消费：</span><span style={{ color: '#fff' }}>¥{shopInfo.priceRange}</span></div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Step 2: 选择菜品图片 */}
                <section style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ background: '#D4AF37', color: '#000', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>2</span>
                        选择菜品图片
                        {allSelectedCount > 0 && <span style={{ color: '#D4AF37', marginLeft: '8px' }}>已选 {allSelectedCount} 张</span>}
                    </div>

                    <input ref={foodInputRef} type="file" accept="image/*" multiple onChange={handleFoodUpload} style={{ display: 'none' }} />

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {/* 历史图片 */}
                        {historyImages.map(img => {
                            const isSelected = selectedImages.includes(img.originalData)
                            return (
                                <button
                                    key={img.id}
                                    onClick={() => toggleHistoryImage(img.id, img.originalData)}
                                    style={{
                                        width: '70px', height: '70px', borderRadius: '10px', overflow: 'hidden',
                                        border: isSelected ? '2px solid #D4AF37' : '2px solid transparent',
                                        padding: 0, cursor: 'pointer', position: 'relative'
                                    }}
                                >
                                    <img src={`data:image/jpeg;base64,${img.originalData}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    {isSelected && (
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Check size={20} color="#D4AF37" strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            )
                        })}

                        {/* 新上传的图片 */}
                        {newImages.map((img, idx) => (
                            <div key={`new-${idx}`} style={{ width: '70px', height: '70px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #D4AF37', position: 'relative' }}>
                                <img src={`data:image/jpeg;base64,${img}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button
                                    onClick={() => setNewImages(prev => prev.filter((_, i) => i !== idx))}
                                    style={{ position: 'absolute', top: 2, right: 2, width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}

                        {/* 上传按钮 */}
                        <button
                            onClick={() => foodInputRef.current?.click()}
                            style={{
                                width: '70px', height: '70px', borderRadius: '10px',
                                border: '2px dashed #333', background: '#0a0a0a',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#444'
                            }}
                        >
                            <Plus size={24} />
                        </button>
                    </div>
                </section>

                {/* 生成按钮 */}
                <button
                    onClick={handleGenerate}
                    disabled={!shopInfo || allSelectedCount === 0 || generating}
                    style={{
                        width: '100%', height: '52px', borderRadius: '26px',
                        background: shopInfo && allSelectedCount > 0 && !generating
                            ? 'linear-gradient(135deg, #D4AF37 0%, #B8962E 50%, #D4AF37 100%)'
                            : '#222',
                        border: 'none', color: shopInfo && allSelectedCount > 0 && !generating ? '#000' : '#555',
                        fontWeight: 700, fontSize: '14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        cursor: shopInfo && allSelectedCount > 0 && !generating ? 'pointer' : 'not-allowed',
                        marginBottom: '24px'
                    }}
                >
                    {generating ? (
                        <>
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            AI 正在撰写文案...
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} fill={shopInfo && allSelectedCount > 0 ? '#000' : '#555'} />
                            生成点评文案
                        </>
                    )}
                </button>

                {/* 生成结果 */}
                {reviews.length > 0 && (
                    <section>
                        <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ background: '#4CAF50', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>✓</span>
                            生成完成 · 点击复制
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {reviews.map((review, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => copyReview(review, idx)}
                                    style={{
                                        width: '100%', textAlign: 'left',
                                        padding: '16px', borderRadius: '12px',
                                        background: '#111', border: '1px solid #222',
                                        color: '#ddd', fontSize: '13px', lineHeight: '1.8',
                                        cursor: 'pointer', position: 'relative',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ position: 'absolute', top: 12, right: 12, color: copiedIndex === idx ? '#4CAF50' : '#666' }}>
                                        {copiedIndex === idx ? <Check size={16} /> : <Copy size={16} />}
                                    </div>
                                    <div style={{ paddingRight: '30px' }}>{review}</div>
                                    <div style={{ marginTop: '8px', fontSize: '10px', color: '#555' }}>
                                        {copiedIndex === idx ? '已复制!' : `文案 ${idx + 1} · ${review.length} 字`}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <style jsx global>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
