'use client'

import { Check } from 'lucide-react'

export const STYLES = [
    { id: 'michelin-star', name: '米其林', sub: 'MICHELIN', image: '/assets/styles/style_michelin_1768654850793.png' },
    { id: 'nordic-minimalist', name: '北欧系', sub: 'NORDIC', image: '/assets/styles/style_nordic_1768654864840.png' },
    { id: 'moody-cinematic', name: '暗调', sub: 'MOODY', image: '/assets/styles/style_moody_1768654878267.png' },
    { id: 'japanese-zen', name: '禅意', sub: 'ZEN', image: '/assets/styles/style_zen_1768654891745.png' },
    { id: 'commercial-editorial', name: '商业大片', sub: 'EDITORIAL', image: '/assets/styles/style_commercial_1768655424752.png' },
    { id: 'rustic-farmhouse', name: '田园风', sub: 'RUSTIC', image: '/assets/styles/style_rustic_1768654953559.png' },
    { id: 'french-patisserie', name: '法式甜品', sub: 'PATISSERIE', image: '/assets/styles/style_patisserie_1768655437857.png' },
    { id: 'macro-detail', name: '微距质感', sub: 'MACRO', image: '/assets/styles/style_macro_1768655015215.png' },
    { id: 'airy-bright', name: '明亮清新', sub: 'AIRY', image: '/assets/styles/style_airy_1768655033506.png' },
    { id: 'dark-luxury', name: '黑金奢华', sub: 'LUXURY', image: '/assets/styles/style_dark_luxury_1768655051914.png' }
]

interface StyleSelectorProps {
    selectedStyle: string
    onSelect: (style: string) => void
}

export function StyleSelector({ selectedStyle, onSelect }: StyleSelectorProps) {
    return (
        <div style={{ width: '100%', paddingTop: '8px' }}>
            {/* Story Layout Container */}
            <div
                className="no-scrollbar"
                style={{
                    display: 'flex',
                    gap: '12px',
                    overflowX: 'auto',
                    paddingBottom: '16px',
                    paddingLeft: '4px',
                    paddingRight: '4px',
                }}
            >
                {STYLES.map((style) => {
                    const isSelected = selectedStyle === style.id
                    return (
                        <button
                            key={style.id}
                            onClick={() => onSelect(style.id)}
                            style={{
                                flex: '0 0 auto',
                                width: '80px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                            }}
                        >
                            {/* Image Container */}
                            <div style={{
                                width: '72px',
                                height: '72px',
                                borderRadius: '20px',
                                padding: '3px',
                                background: isSelected ? 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)' : 'transparent',
                                marginBottom: '8px',
                                transition: 'all 0.3s ease',
                            }}>
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '17px',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    border: isSelected ? '2px solid #000' : '2px solid rgba(255,255,255,0.1)',
                                }}>
                                    <img
                                        src={style.image}
                                        alt={style.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            filter: isSelected ? 'brightness(1)' : 'brightness(0.7)',
                                            transition: 'filter 0.3s ease'
                                        }}
                                    />
                                    {isSelected && (
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'rgba(212,175,55,0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Check size={20} color="#fff" strokeWidth={3} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Text */}
                            <p style={{
                                color: isSelected ? '#D4AF37' : '#888',
                                fontSize: '11px',
                                fontWeight: isSelected ? 700 : 500,
                                lineHeight: '1.2',
                                letterSpacing: '0.5px'
                            }}>
                                {style.name}
                            </p>
                        </button>
                    )
                })}
            </div>
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    )
}
