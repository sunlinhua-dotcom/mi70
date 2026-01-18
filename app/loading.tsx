'use client'

export default function Loading() {
    return (
        <main className="min-h-screen bg-[#000000] text-white relative overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#C9A962]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#C9A962]/5 rounded-full blur-[100px]" />
            </div>

            {/* Skeleton Header */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                paddingTop: '16px',
                paddingBottom: '8px',
            }}>
                <div style={{
                    maxWidth: '430px',
                    margin: '0 auto',
                    padding: '0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#222' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ width: '50px', height: '20px', borderRadius: '4px', background: '#222' }} />
                            <div style={{ width: '60px', height: '8px', borderRadius: '2px', background: '#1a1a1a' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '32px', borderRadius: '16px', background: '#222' }} />
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#222' }} />
                    </div>
                </div>
            </header>

            {/* Skeleton Content */}
            <div className="relative z-10 max-w-lg mx-auto px-6 py-8">
                <div style={{ paddingTop: '16px' }}>
                    {/* Upload Skeleton */}
                    <div style={{
                        height: '180px',
                        borderRadius: '16px',
                        background: '#111',
                        border: '1px solid #222',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: '2px solid #333',
                            borderTopColor: '#D4AF37',
                            animation: 'spin 1s linear infinite'
                        }} />
                    </div>

                    {/* Style Selector Skeleton */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ width: '60px', height: '12px', borderRadius: '4px', background: '#222', marginBottom: '12px' }} />
                        <div style={{ display: 'flex', gap: '12px', overflowX: 'hidden' }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} style={{
                                    width: '72px',
                                    height: '72px',
                                    borderRadius: '20px',
                                    background: '#1a1a1a',
                                    flexShrink: 0
                                }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </main>
    )
}
