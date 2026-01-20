'use client'

import { Check } from 'lucide-react'

export const STYLES = [
    { id: 'michelin-star', name: '米其林', sub: 'MICHELIN', image: '/assets/styles/style_icon_michelin_v3.webp' },
    { id: 'hk-chaachaan', name: '港式茶餐厅', sub: 'HK STYLE', image: '/assets/styles/style_icon_hk_v3.webp' },
    { id: 'japanese-zen', name: '禅意和风', sub: 'ZEN', image: '/assets/styles/style_icon_zen_v3.webp' },
    { id: 'chinese-street', name: '中式烟火气', sub: 'STREET', image: '/assets/styles/style_icon_street_v3.webp' },
    { id: 'french-romantic', name: '法式浪漫', sub: 'ROMANTIC', image: '/assets/styles/style_icon_romantic_v3.webp' },
    { id: 'nordic-morandi', name: '清新莫兰迪', sub: 'MORANDI', image: '/assets/styles/style_icon_morandi_v3.webp' },
    { id: 'macro-detail', name: '微距质感', sub: 'MACRO', image: '/assets/styles/style_icon_macro_v3.webp' },
    { id: 'vintage-rustic', name: '美式复古', sub: 'VINTAGE', image: '/assets/styles/style_icon_rustic_v3.webp' },
    { id: 'food-story', name: '美食故事', sub: 'STORY', image: '/assets/styles/style_icon_story_v1.webp' },
    { id: 'shanghai-style', name: '上海菜', sub: 'SH STYLE', image: '/assets/styles/style_icon_shanghai_v1.webp' }
]

interface StyleSelectorProps {
    selectedStyle: string
    onSelect: (style: string) => void
}

export function StyleSelector({ selectedStyle, onSelect }: StyleSelectorProps) {
    return (
        <div style={{ width: '100%', paddingTop: '8px' }}>
            {/* Grid Layout Container */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '12px',
                    padding: '8px 4px',
                }}
            >
                {STYLES.map((style) => {
                    const isSelected = selectedStyle === style.id
                    return (
                        <button
                            key={style.id}
                            onClick={() => onSelect(style.id)}
                            style={{
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
                                width: '100%',
                                aspectRatio: '1/1',
                                borderRadius: '16px',
                                padding: '2px',
                                background: isSelected ? 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)' : 'rgba(255,255,255,0.05)',
                                marginBottom: '6px',
                                transition: 'all 0.3s ease',
                            }}>
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '14px',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    border: isSelected ? '2px solid #000' : 'none',
                                }}>
                                    <img
                                        src={style.image}
                                        alt={style.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            filter: isSelected ? 'brightness(1)' : 'brightness(0.6)',
                                            transition: 'filter 0.3s ease'
                                        }}
                                    />
                                    {isSelected && (
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'rgba(212,175,55,0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <div style={{
                                                background: '#D4AF37',
                                                borderRadius: '50%',
                                                padding: '2px',
                                                display: 'flex',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                                            }}>
                                                <Check size={14} color="#000" strokeWidth={4} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Text */}
                            <p style={{
                                color: isSelected ? '#D4AF37' : '#999',
                                fontSize: '11px',
                                fontWeight: isSelected ? 700 : 500,
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                width: '100%'
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
