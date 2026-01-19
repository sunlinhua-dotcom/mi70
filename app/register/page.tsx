'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { Loader2 } from 'lucide-react'

// Hardcoded styles for reliability
const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#FFFFFF'
    },
    input: {
        width: '100%',
        backgroundColor: '#111111',
        border: '1px solid #333333',
        borderRadius: '12px',
        padding: '16px',
        color: '#FFFFFF',
        fontSize: '16px',
        outline: 'none',
        marginBottom: '16px'
    },
    button: {
        width: '100%',
        padding: '16px',
        borderRadius: '12px',
        background: 'linear-gradient(90deg, #D4AF37 0%, #AA8C2C 100%)',
        color: '#000000',
        fontWeight: 'bold',
        fontSize: '16px',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginTop: '24px'
    }
}

export default function RegisterPage() {
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            await axios.post('/api/register', { username, password })
            router.push('/login?registered=true')
        } catch (err: any) {
            setError(err.response?.data?.error || '注册失败，请稍后重试')
            setIsLoading(false)
        }
    }

    return (
        <main style={styles.container}>
            {/* Logo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '48px' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    marginBottom: '16px',
                    border: '1px solid #D4AF37',
                    boxShadow: '0 10px 30px rgba(212,175,55,0.3)'
                }}>
                    <img src="/assets/styles/logo_mi70_small.webp" alt="米70" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '1px', color: '#D4AF37' }}>米70</h1>
                <p style={{ color: '#666', fontSize: '12px', marginTop: '4px', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    JOIN THE ELITE
                </p>
            </div>

            {error && (
                <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '12px', borderRadius: '8px', width: '100%', maxWidth: '320px', textAlign: 'center', marginBottom: '24px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '320px' }}>
                <div>
                    <label style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                        用户名 (USERNAME)
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={styles.input}
                        placeholder="请输入用户名"
                        required
                    />
                </div>

                <div>
                    <label style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                        密码 (PASSWORD)
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                        placeholder="请输入密码"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    style={{ ...styles.button, opacity: isLoading ? 0.7 : 1 }}
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            立即注册 (Sign Up)
                        </>
                    )}
                </button>
            </form>

            <p style={{ color: '#666', fontSize: '12px', marginTop: '32px' }}>
                已有账号?{' '}
                <Link href="/login" style={{ color: '#D4AF37', fontWeight: 'bold' }}>
                    直接登录
                </Link>
            </p>
        </main>
    )
}
