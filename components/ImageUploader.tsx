'use client'

import { useCallback, useState } from 'react'
import { Plus, X } from 'lucide-react'
import Image from 'next/image'

interface ImageUploaderProps {
    files: File[]
    onFilesChange: (files: File[]) => void
}

export function ImageUploader({ files, onFilesChange }: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false)

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files?.length) {
            const newFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'))
            onFilesChange([...files, ...newFiles])
        }
    }, [files, onFilesChange])

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            const newFiles = Array.from(e.target.files)
            onFilesChange([...files, ...newFiles])
        }
    }, [files, onFilesChange])

    const removeFile = useCallback((index: number) => {
        const newFiles = [...files]
        newFiles.splice(index, 1)
        onFilesChange(newFiles)
    }, [files, onFilesChange])

    return (
        <div style={{ width: '100%' }}>
            {/* Main Upload Card - Compact Size */}
            {files.length === 0 ? (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    style={{
                        background: 'linear-gradient(180deg, rgba(30,30,30,0.8) 0%, rgba(10,10,10,0.95) 100%)',
                        border: isDragging ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.15)',
                        boxShadow: isDragging ? '0 0 20px rgba(212,175,55,0.2)' : 'none',
                        borderRadius: '20px',
                        height: '160px', // 缩小！
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            cursor: 'pointer',
                            zIndex: 50
                        }}
                        onChange={handleFileSelect}
                    />

                    {/* Content Wrapper */}
                    <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* Small Circle Button */}
                        <div
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: '#000000',
                                border: '1px solid #D4AF37',
                                boxShadow: '0 0 15px rgba(212,175,55,0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '12px'
                            }}
                        >
                            <Plus size={20} color="#D4AF37" strokeWidth={2} />
                        </div>

                        <h3 style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>
                            上传您的美食作品
                        </h3>
                        <p style={{ color: '#666666', fontSize: '10px', letterSpacing: '1px' }}>
                            点击选择 或 拖拽照片
                        </p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {/* Uploaded Images - Small Thumbnails */}
                    {files.map((file, idx) => (
                        <div
                            key={idx}
                            style={{
                                position: 'relative',
                                width: '80px',
                                height: '80px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: '1px solid rgba(212,175,55,0.3)',
                                flexShrink: 0
                            }}
                        >
                            <Image
                                src={URL.createObjectURL(file)}
                                alt="Preview"
                                fill
                                style={{ objectFit: 'cover' }}
                            />
                            <button
                                onClick={() => removeFile(idx)}
                                style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.7)',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    zIndex: 20
                                }}
                            >
                                <X size={12} color="#fff" />
                            </button>
                        </div>
                    ))}

                    {/* Add More Button */}
                    <div
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '12px',
                            background: '#111111',
                            border: '1px dashed rgba(255,255,255,0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            cursor: 'pointer',
                            flexShrink: 0
                        }}
                    >
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                opacity: 0,
                                cursor: 'pointer',
                                zIndex: 10
                            }}
                            onChange={handleFileSelect}
                        />
                        <Plus size={18} color="#D4AF37" />
                        <span style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>添加</span>
                    </div>
                </div>
            )}
        </div>
    )
}
