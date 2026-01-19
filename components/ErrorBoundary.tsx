'use client'

import { Component, ReactNode } from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo)
        // 可以在这里上报错误到监控服务
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div style={{
                    minHeight: '100vh',
                    background: '#000',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>😵</div>
                    <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#D4AF37' }}>
                        页面出错了
                    </h2>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px', maxWidth: '300px' }}>
                        {this.state.error?.message || '发生了未知错误'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 24px',
                            background: 'rgba(212,175,55,0.2)',
                            border: '1px solid rgba(212,175,55,0.4)',
                            borderRadius: '24px',
                            color: '#D4AF37',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    >
                        重新加载
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
