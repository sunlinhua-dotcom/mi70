'use client'

import { useCallback, useState } from 'react'
import { Plus, X, UploadCloud, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

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
            <AnimatePresence mode="wait">
                {files.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onDragOver={handleDragOver}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        style={{
                            background: isDragging
                                ? 'linear-gradient(180deg, rgba(212,175,55,0.15) 0%, rgba(0,0,0,0.95) 100%)'
                                : 'linear-gradient(180deg, rgba(30,30,30,0.6) 0%, rgba(10,10,10,0.9) 100%)',
                            border: isDragging ? '2px dashed #D4AF37' : '1px solid rgba(255,255,255,0.1)',
                            boxShadow: isDragging ? '0 0 30px rgba(212,175,55,0.15)' : '0 10px 30px rgba(0,0,0,0.5)',
                            borderRadius: '24px',
                            height: '180px',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                            cursor: 'pointer'
                        }}
                    >
                        {/* Background subtle decoration */}
                        <div style={{
                            position: 'absolute', top: -50, right: -50, width: 200, height: 200,
                            borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)',
                            zIndex: 1
                        }} />

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
                        <motion.div
                            animate={{ scale: isDragging ? 1.05 : 1 }}
                            style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        >
                            <motion.div
                                animate={isDragging ? { y: -5 } : { y: 0 }}
                                style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '18px',
                                    background: isDragging ? '#D4AF37' : 'rgba(0,0,0,0.8)',
                                    border: isDragging ? 'none' : '1px solid rgba(212,175,55,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '16px',
                                    boxShadow: isDragging ? '0 10px 20px rgba(212,175,55,0.3)' : '0 5px 15px rgba(0,0,0,0.3)'
                                }}
                            >
                                {isDragging ? (
                                    <UploadCloud size={28} color="#000" />
                                ) : (
                                    <Plus size={28} color="#D4AF37" strokeWidth={1.5} />
                                )}
                            </motion.div>

                            <h3 style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '6px' }}>
                                添加您的美食素材
                            </h3>
                            <p style={{ color: '#888', fontSize: '12px', letterSpacing: '0.5px' }}>
                                AI 艺术大片从这张照片开始
                            </p>
                        </motion.div>

                        {/* Corner Accents */}
                        <div style={{ position: 'absolute', top: 12, left: 12, width: 20, height: 20, borderTop: '1px solid rgba(212,175,55,0.3)', borderLeft: '1px solid rgba(212,175,55,0.3)', borderTopLeftRadius: 8 }} />
                        <div style={{ position: 'absolute', bottom: 12, right: 12, width: 20, height: 20, borderBottom: '1px solid rgba(212,175,55,0.3)', borderRight: '1px solid rgba(212,175,55,0.3)', borderBottomRightRadius: 8 }} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="previews"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}
                    >
                        {/* Summary Card (New) */}
                        <div style={{
                            width: '100%',
                            marginBottom: '4px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0 4px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ImageIcon size={14} color="#D4AF37" />
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>待转换素材 ({files.length})</span>
                            </div>
                            <button
                                onClick={() => onFilesChange([])}
                                style={{ background: 'none', border: 'none', color: '#666', fontSize: '11px', cursor: 'pointer' }}
                            >
                                清空
                            </button>
                        </div>

                        {/* Uploaded Images - More Premium Thumbnails */}
                        {files.map((file, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                style={{
                                    position: 'relative',
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(212,175,55,0.5)',
                                    boxShadow: '0 8px 15px rgba(0,0,0,0.4)',
                                    flexShrink: 0
                                }}
                            >
                                <Image
                                    src={URL.createObjectURL(file)}
                                    alt="Preview"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => removeFile(idx)}
                                    style={{
                                        position: 'absolute',
                                        top: '6px',
                                        right: '6px',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '8px',
                                        background: 'rgba(0,0,0,0.6)',
                                        backdropFilter: 'blur(4px)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        zIndex: 20
                                    }}
                                >
                                    <X size={14} color="#fff" />
                                </motion.button>
                                {/* Badge */}
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                    padding: '4px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                                    fontSize: '9px', color: '#aaa', textAlign: 'center'
                                }}>
                                    待处理
                                </div>
                            </motion.div>
                        ))}

                        {/* Add More Button - Matching style */}
                        <motion.div
                            whileHover={{ backgroundColor: 'rgba(212,175,55,0.05)', scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '16px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px dashed rgba(212,175,55,0.3)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                cursor: 'pointer',
                                flexShrink: 0,
                                transition: 'all 0.2s'
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
                            <div style={{ padding: '8px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)' }}>
                                <Plus size={20} color="#D4AF37" />
                            </div>
                            <span style={{ fontSize: '11px', color: '#888', marginTop: '8px', fontWeight: 500 }}>继续添加</span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
