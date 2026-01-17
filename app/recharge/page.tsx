'use client'

import Link from "next/link"
import { ArrowLeft, CreditCard, Gift, Coins } from "lucide-react"

export default function RechargePage() {
    return (
        <div style={{
            minHeight: '100vh',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
        }}>
            <div style={{
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center'
            }}>
                {/* Header */}
                <div style={{ position: 'relative', marginBottom: '32px' }}>
                    <Link
                        href="/"
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(212,175,55,0.1)',
                            border: '1px solid rgba(212,175,55,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none'
                        }}
                    >
                        <ArrowLeft size={18} color="#D4AF37" />
                    </Link>
                    <h1 style={{
                        color: '#D4AF37',
                        fontSize: '22px',
                        fontWeight: 700,
                        letterSpacing: '2px'
                    }}>
                        充值积分
                    </h1>
                </div>

                {/* WeChat Pay Card */}
                <div style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #8B7355 50%, #D4AF37 100%)',
                    padding: '28px',
                    borderRadius: '20px',
                    marginBottom: '24px',
                    boxShadow: '0 8px 32px rgba(212,175,55,0.3)'
                }}>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'rgba(0,0,0,0.6)',
                        letterSpacing: '2px',
                        marginBottom: '8px'
                    }}>
                        微信支付
                    </div>
                    <div style={{
                        fontSize: '28px',
                        fontWeight: 800,
                        color: '#000',
                        marginBottom: '8px',
                        letterSpacing: '2px'
                    }}>
                        SUNLINHUAMJ
                    </div>
                    <p style={{
                        color: 'rgba(0,0,0,0.5)',
                        fontSize: '12px'
                    }}>
                        扫码或搜索此微信号转账
                    </p>
                </div>

                {/* Pricing Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    {/* Standard Pack */}
                    <div style={{
                        padding: '20px',
                        borderRadius: '16px',
                        background: 'rgba(212,175,55,0.1)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <CreditCard size={16} color="#D4AF37" />
                                <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>标准套餐</span>
                            </div>
                            <div style={{ color: '#D4AF37', fontSize: '12px' }}>
                                获得 <strong>50</strong> 积分（可生成50张）
                            </div>
                        </div>
                        <div style={{
                            color: '#D4AF37',
                            fontSize: '24px',
                            fontWeight: 800
                        }}>
                            ¥50
                        </div>
                    </div>

                    {/* Trial Pack */}
                    <div style={{
                        padding: '20px',
                        borderRadius: '16px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        opacity: 0.6
                    }}>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <Gift size={16} color="#888" />
                                <span style={{ color: '#888', fontWeight: 600, fontSize: '14px' }}>新手礼包</span>
                            </div>
                            <div style={{ color: '#666', fontSize: '12px' }}>
                                注册即送 5 积分
                            </div>
                        </div>
                        <div style={{
                            color: '#888',
                            fontSize: '18px',
                            fontWeight: 700
                        }}>
                            免费
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'left'
                }}>
                    <div style={{
                        color: '#D4AF37',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginBottom: '12px',
                        letterSpacing: '1px'
                    }}>
                        充值说明
                    </div>
                    <ol style={{
                        color: '#888',
                        fontSize: '12px',
                        lineHeight: 1.8,
                        listStyle: 'none',
                        padding: 0,
                        margin: 0
                    }}>
                        <li style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ color: '#D4AF37' }}>1.</span>
                            向上述微信号转账 ¥50
                        </li>
                        <li style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ color: '#D4AF37' }}>2.</span>
                            转账备注填写您的 <strong style={{ color: '#fff' }}>用户名</strong>
                        </li>
                        <li style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#D4AF37' }}>3.</span>
                            1小时内为您充值到账
                        </li>
                    </ol>
                </div>

                {/* Contact */}
                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                    <div style={{
                        background: '#fff',
                        padding: '12px',
                        borderRadius: '16px',
                        display: 'inline-block',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
                    }}>
                        <img
                            src="/wechat-qr.jpg"
                            alt="Scan to Add WeChat"
                            style={{ width: '160px', height: '160px', display: 'block', borderRadius: '8px' }}
                        />
                    </div>
                    <p style={{
                        color: '#666',
                        fontSize: '12px',
                        marginTop: '16px',
                        letterSpacing: '1px'
                    }}>
                        扫一扫二维码 添加好友
                    </p>
                </div>
            </div>
        </div>
    )
}
