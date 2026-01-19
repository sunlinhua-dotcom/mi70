'use client'

import { useState, useRef, useCallback } from 'react'

interface ImageCompareSliderProps {
    beforeSrc: string
    afterSrc: string
    beforeLabel?: string
    afterLabel?: string
}

export function ImageCompareSlider({
    beforeSrc,
    afterSrc,
    beforeLabel = '原图',
    afterLabel = '效果'
}: ImageCompareSliderProps) {
    const [sliderPosition, setSliderPosition] = useState(50)
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const handleMove = useCallback((clientX: number) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = clientX - rect.left
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
        setSliderPosition(percentage)
    }, [])

    const handleMouseDown = () => setIsDragging(true)
    const handleMouseUp = () => setIsDragging(false)
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) handleMove(e.clientX)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        handleMove(e.touches[0].clientX)
    }

    return (
        <div
            ref={containerRef}
            className="image-compare-slider"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                cursor: 'ew-resize',
                userSelect: 'none',
                borderRadius: '12px'
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
        >
            {/* After Image (Full) */}
            <img
                src={afterSrc}
                alt="After"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                }}
                draggable={false}
            />

            {/* Before Image (Clipped) */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${sliderPosition}%`,
                    height: '100%',
                    overflow: 'hidden'
                }}
            >
                <img
                    src={beforeSrc}
                    alt="Before"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                    draggable={false}
                />
            </div>

            {/* Slider Handle */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `${sliderPosition}%`,
                    transform: 'translateX(-50%)',
                    width: '4px',
                    background: 'linear-gradient(to bottom, #D4AF37, #AA8C2C)',
                    boxShadow: '0 0 10px rgba(212,175,55,0.5)',
                    zIndex: 10
                }}
            >
                {/* Handle Circle */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#000',
                        border: '2px solid #D4AF37',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
                        <path d="M18 8L22 12L18 16" />
                        <path d="M6 8L2 12L6 16" />
                    </svg>
                </div>
            </div>

            {/* Labels */}
            <span style={{
                position: 'absolute',
                top: 8,
                left: 8,
                fontSize: '10px',
                background: 'rgba(0,0,0,0.7)',
                padding: '4px 8px',
                borderRadius: '6px',
                color: '#888',
                zIndex: 5
            }}>
                {beforeLabel}
            </span>
            <span style={{
                position: 'absolute',
                top: 8,
                right: 8,
                fontSize: '10px',
                background: 'rgba(212,175,55,0.8)',
                padding: '4px 8px',
                borderRadius: '6px',
                color: '#000',
                fontWeight: 600,
                zIndex: 5
            }}>
                {afterLabel}
            </span>
        </div>
    )
}
