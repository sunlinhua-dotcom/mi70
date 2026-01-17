'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ totalPages }: { totalPages: number }) {
    const searchParams = useSearchParams()
    const { replace } = useRouter()

    const currentPage = Number(searchParams.get('page')) || 1

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams)
        params.set('page', pageNumber.toString())
        replace(`/admin?${params.toString()}`)
    }

    if (totalPages <= 1) return null

    return (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', marginTop: '20px' }}>
            <button
                disabled={currentPage <= 1}
                onClick={() => createPageURL(currentPage - 1)}
                style={{
                    padding: '8px', borderRadius: '8px',
                    background: '#111', border: '1px solid #333', color: '#fff',
                    opacity: currentPage <= 1 ? 0.5 : 1, cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
                }}
            >
                <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '12px', color: '#888' }}>
                Page {currentPage} of {totalPages}
            </span>
            <button
                disabled={currentPage >= totalPages}
                onClick={() => createPageURL(currentPage + 1)}
                style={{
                    padding: '8px', borderRadius: '8px',
                    background: '#111', border: '1px solid #333', color: '#fff',
                    opacity: currentPage >= totalPages ? 0.5 : 1, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
                }}
            >
                <ChevronRight size={16} />
            </button>
        </div>
    )
}
