'use client'

import { signOut } from "next-auth/react"
import { Crown, Power, FileText } from "lucide-react"
import { useState } from "react"
import { RechargeModal } from "./RechargeModal"
import Link from "next/link"

interface HeaderProps {
    user: {
        credits: number
        username: string
    }
    isSuperUser: boolean
}

export default function Header({ user, isSuperUser }: HeaderProps) {
    const [showRecharge, setShowRecharge] = useState(false)

    return (
        <>
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                paddingTop: '16px',
                paddingBottom: '8px',
                background: 'transparent',
            }}>
                <div style={{
                    maxWidth: '430px',
                    margin: '0 auto',
                    padding: '0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    {/* Left: Logo + Brand */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Logo Circle */}
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '1px solid rgba(212,175,55,0.4)',
                            flexShrink: 0,
                        }}>
                            <img
                                src="/assets/styles/logo_mi70.png"
                                alt="米70"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        {/* Brand Text */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                color: '#D4AF37',
                                letterSpacing: '3px',
                                lineHeight: 1,
                            }}>米70</span>
                            <span style={{
                                fontSize: '8px',
                                color: 'rgba(255,255,255,0.4)',
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                marginTop: '2px',
                            }}>FINE DINING</span>
                        </div>
                    </div>

                    {/* Right: Review Button + PRO Badge + Logout */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Review/文案 Button */}
                        <Link href="/review" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            textDecoration: 'none',
                            color: '#888'
                        }}>
                            <FileText size={12} />
                            <span style={{ fontSize: '11px', fontWeight: 500 }}>文案</span>
                        </Link>

                        {/* PRO Badge (for super user) OR Credits Button */}
                        {isSuperUser ? (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(212,175,55,0.15)',
                                border: '1px solid rgba(212,175,55,0.5)',
                                padding: '6px 12px',
                                borderRadius: '20px',
                            }}>
                                <Crown size={12} color="#D4AF37" strokeWidth={2.5} />
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#D4AF37', letterSpacing: '1px' }}>PRO</span>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowRecharge(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'linear-gradient(135deg, #D4AF37 0%, #8B7355 50%, #D4AF37 100%)',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 10px rgba(212,175,55,0.3)',
                                }}
                            >
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#000',
                                    boxShadow: 'inset 0 0 2px rgba(255,255,255,0.5)',
                                }} />
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: '#000',
                                    letterSpacing: '1px',
                                }}>CREDITS: {user.credits}</span>
                            </button>
                        )}

                        {/* Logout Power Button */}
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'rgba(212,175,55,0.1)',
                                border: '1px solid rgba(212,175,55,0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            title="退出登录"
                        >
                            <Power size={14} color="#D4AF37" strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </header>

            <RechargeModal isOpen={showRecharge} onClose={() => setShowRecharge(false)} />
        </>
    )
}
