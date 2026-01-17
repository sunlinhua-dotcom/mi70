'use client'

import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'

export function SearchInput({ placeholder }: { placeholder: string }) {
    const searchParams = useSearchParams()
    const { replace } = useRouter()

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams)
        if (term) {
            params.set('q', term)
        } else {
            params.delete('q')
        }
        params.set('page', '1') // Reset to page 1
        replace(`/admin?${params.toString()}`)
    }, 300)

    return (
        <div style={{ position: 'relative', maxWidth: '300px' }}>
            <Search size={16} color="#666" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
                defaultValue={searchParams.get('q')?.toString()}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={placeholder}
                style={{
                    width: '100%', padding: '10px 10px 10px 36px',
                    borderRadius: '8px', border: '1px solid #333',
                    background: '#111', color: '#fff', fontSize: '13px', outline: 'none'
                }}
            />
        </div>
    )
}
