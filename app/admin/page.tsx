import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { SearchInput } from "./search-input"
import { Pagination } from "./pagination"

export default async function AdminPage({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.name) redirect('/login')

    const currentUser = await prisma.user.findUnique({ where: { username: session.user.name } })
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.username === 'sbrain'

    if (!isAdmin) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' }}>Access Denied</div>
    }

    // Params
    const params = await searchParams
    const q = typeof params.q === 'string' ? params.q : undefined
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1
    const limit = 20
    const skip = (page - 1) * limit

    // Fetch Users with pagination and search
    const where = q ? { username: { contains: q } } : {}

    const [users, totalUsers] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: skip
        }),
        prisma.user.count({ where })
    ])

    const totalPages = Math.ceil(totalUsers / limit)

    // Other data
    const pendingJobs = await prisma.generationJob.findMany({
        where: { status: { in: ['PENDING', 'PROCESSING'] } },
        include: { user: true },
        orderBy: { createdAt: 'asc' }
    })

    const completedJobs = await prisma.generationJob.findMany({
        where: { status: { in: ['COMPLETED', 'FAILED'] } },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 10 // Reduce for compactness
    })

    async function addCredits(formData: FormData) {
        "use server"
        const username = formData.get('username') as string
        const amount = parseInt(formData.get('amount') as string)
        if (username && amount) {
            await prisma.user.update({
                where: { username },
                data: { credits: { increment: amount } }
            })
            revalidatePath('/admin')
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', padding: '40px' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px', color: '#D4AF37' }}>
                    Admin Console
                </h1>

                {/* Dashboard Stats / Quick Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px', marginBottom: '40px' }}>
                    {/* Activity Monitor */}
                    <div style={{ background: '#111', borderRadius: '16px', border: '1px solid #222', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#D4AF37' }}>Recent Activity</h2>
                            <div style={{ fontSize: '12px', color: '#666' }}>Last 10 results</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
                            {completedJobs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#444' }}>No recent activity</div>
                            ) : completedJobs.map(job => (
                                <div key={job.id} style={{
                                    background: '#0a0a0a', border: '1px solid #1a1a1a',
                                    borderRadius: '12px', padding: '12px',
                                    display: 'flex', gap: '15px', alignItems: 'center'
                                }}>
                                    {/* Small Image Preview Bundle */}
                                    <div style={{ display: 'flex', gap: '4px', height: '60px' }}>
                                        <div style={{ width: '60px', borderRadius: '4px', overflow: 'hidden', background: '#111' }}>
                                            <img
                                                src={`/api/images?id=${job.id}&type=thumb`}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                alt="Original"
                                            />
                                        </div>
                                        <div style={{ width: '60px', borderRadius: '4px', overflow: 'hidden', background: '#111', border: '1px solid #D4AF37' }}>
                                            {job.status === 'COMPLETED' ? (
                                                <img
                                                    src={`/api/images?id=${job.id}&type=result`}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    alt="Result"
                                                />
                                            ) : (
                                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#ff4444' }}>FAIL</div>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Link href={`/admin/user/${job.user.id}`} style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6', textDecoration: 'none' }}>
                                                {job.user.username}
                                            </Link>
                                            <span style={{ fontSize: '10px', color: '#666' }}>{new Date(job.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                                            {job.style} · <span style={{ color: job.status === 'COMPLETED' ? '#4CAF50' : '#ff4444' }}>{job.status}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Queue Monitor */}
                        <div style={{ background: '#111', borderRadius: '16px', border: '1px solid #222', padding: '20px' }}>
                            <h2 style={{ fontSize: '16px', marginBottom: '16px', color: '#888' }}>Live Queue</h2>
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {pendingJobs.length === 0 ? <span style={{ color: '#444' }}>No pending jobs</span> : pendingJobs.map(job => (
                                    <div key={job.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #222' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {job.status === 'PROCESSING' ? <Loader2 size={14} className="animate-spin" color="#D4AF37" /> : <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#666' }} />}
                                            <span style={{ fontSize: '13px' }}>{job.style}</span>
                                        </div>
                                        <span style={{ fontSize: '12px', color: '#666' }}>{job.user.username}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Recharge */}
                        <div style={{ background: 'rgba(212,175,55,0.05)', borderRadius: '16px', border: '1px solid rgba(212,175,55,0.2)', padding: '20px' }}>
                            <h2 style={{ fontSize: '16px', marginBottom: '16px', color: '#D4AF37' }}>Fast Recharge</h2>
                            <form action={addCredits} style={{ display: 'flex', gap: '10px' }}>
                                <input name="username" placeholder="Username" style={{ flex: 1, background: '#000', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '13px' }} required />
                                <input name="amount" type="number" defaultValue="100" style={{ width: '80px', background: '#000', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '13px' }} required />
                                <button type="submit" style={{ background: '#D4AF37', color: '#000', fontWeight: 600, padding: '0 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Add</button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* User Management Section */}
                <div style={{ background: '#111', borderRadius: '20px', border: '1px solid #222', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>User Management ({totalUsers})</h2>
                        <SearchInput placeholder="Search users by name..." />
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead style={{ background: '#1a1a1a', color: '#888', textAlign: 'left' }}>
                            <tr>
                                <th style={{ padding: '16px', fontWeight: 500 }}>User</th>
                                <th style={{ padding: '16px', fontWeight: 500 }}>Credits</th>
                                <th style={{ padding: '16px', fontWeight: 500 }}>Role</th>
                                <th style={{ padding: '16px', fontWeight: 500 }}>Joined</th>
                                <th style={{ padding: '16px', fontWeight: 500, textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid #222', color: '#ddd' }}>
                                    <td style={{ padding: '16px' }}>
                                        <Link href={`/admin/user/${u.id}`} style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
                                            {u.username}
                                        </Link>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ color: u.credits > 0 ? '#4CAF50' : '#ff4444', fontWeight: 600 }}>{u.credits}</span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        {u.role === 'ADMIN' ? <span style={{ color: '#D4AF37', fontSize: '10px', border: '1px solid #D4AF37', padding: '2px 6px', borderRadius: '4px' }}>ADMIN</span> : <span style={{ color: '#666' }}>USER</span>}
                                    </td>
                                    <td style={{ padding: '16px', color: '#666', fontSize: '13px' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        <form action={addCredits} style={{ display: 'inline-flex', gap: '8px' }}>
                                            <input type="hidden" name="username" value={u.username} />
                                            <input type="hidden" name="amount" value="50" />
                                            <button type="submit" style={{ fontSize: '12px', color: '#D4AF37', background: 'transparent', border: '1px solid #D4AF37', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                                                +50
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ padding: '20px', borderTop: '1px solid #222' }}>
                        <Pagination totalPages={totalPages} />
                    </div>
                </div>
            </div>
        </div>
    )
}
