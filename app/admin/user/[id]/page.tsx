import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ArrowLeft, Clock, Award, Calendar } from "lucide-react"
import Link from "next/link"
import { Pagination } from "../../pagination"

export default async function UserDetailPage(props: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await props.params;
    const userId = params.id;
    const session = await getServerSession(authOptions)
    if (!session?.user?.name) redirect('/login')

    const currentUser = await prisma.user.findUnique({ where: { username: session.user.name } })
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.username === 'sbrain'

    if (!isAdmin) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' }}>Access Denied</div>
    }

    const page = typeof (await props.searchParams)?.page === 'string' ? parseInt((await props.searchParams).page as string) : 1
    const limit = 20
    const skip = (page - 1) * limit

    const [user, totalJobs] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            include: {
                jobs: {
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    skip: skip
                }
            }
        }),
        prisma.generationJob.count({ where: { userId } })
    ])

    const totalPages = Math.ceil(totalJobs / limit)

    if (!user) {
        return <div style={{ color: '#fff', padding: 40 }}>User not found</div>
    }

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', padding: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', color: '#888', marginBottom: '20px', textDecoration: 'none' }}>
                    <ArrowLeft size={16} style={{ marginRight: '8px' }} />
                    Back to Console
                </Link>

                {/* User Header */}
                <div style={{ background: '#111', borderRadius: '16px', border: '1px solid #222', padding: '30px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#D4AF37', marginBottom: '10px' }}>{user.username}</h1>
                        <div style={{ display: 'flex', gap: '20px', color: '#888', fontSize: '14px' }}>
                            <span style={{ display: 'flex', alignItems: 'center' }}><Calendar size={14} style={{ marginRight: 6 }} /> Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                            <span style={{ display: 'flex', alignItems: 'center' }}><Award size={14} style={{ marginRight: 6 }} /> {user.role}</span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>CREDITS BALANCE</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: user.credits > 0 ? '#4CAF50' : '#ff4444' }}>{user.credits}</div>
                    </div>
                </div>

                {/* History Grid */}
                <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                    <Clock size={18} style={{ marginRight: '10px', color: '#D4AF37' }} />
                    Generation History ({user.jobs.length})
                </h2>

                {user.jobs.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#444', background: '#111', borderRadius: '16px' }}>No deletion history found.</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
                        {user.jobs.map((job: any) => (
                            <div key={job.id} style={{ background: '#111', borderRadius: '12px', overflow: 'hidden', border: '1px solid #222' }}>
                                {/* Before / After Image Display */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                                    {/* Before (Original) */}
                                    <div style={{ position: 'relative', aspectRatio: '1/1', background: '#1a1a1a' }}>
                                        {job.originalData ? (
                                            <img
                                                src={`/api/images?id=${job.id}&type=thumb`}
                                                alt="Original"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '12px' }}>
                                                No Original
                                            </div>
                                        )}
                                        <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', color: '#888' }}>
                                            原图
                                        </div>
                                    </div>

                                    {/* After (Result) */}
                                    <div style={{ position: 'relative', aspectRatio: '1/1', background: '#1a1a1a' }}>
                                        {(job.resultData || job.resultUrl) ? (
                                            <img
                                                src={`/api/images?id=${job.id}&type=result`}
                                                alt="Result"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '12px' }}>
                                                {job.status === 'PENDING' ? '等待中...' : job.status === 'PROCESSING' ? '生成中...' : '失败'}
                                            </div>
                                        )}
                                        <div style={{ position: 'absolute', top: 8, right: 8, background: job.status === 'COMPLETED' ? 'rgba(76,175,80,0.8)' : 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', color: '#fff' }}>
                                            {job.status}
                                        </div>
                                        <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(212,175,55,0.8)', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', color: '#000' }}>
                                            效果图
                                        </div>
                                        <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', color: '#D4AF37' }}>
                                            {job.aspectRatio || '1:1'}
                                        </div>
                                    </div>
                                </div>

                                {/* Info Footer */}
                                <div style={{ padding: '12px', borderTop: '1px solid #222' }}>
                                    <div style={{ fontSize: '12px', color: '#fff', marginBottom: '4px', fontWeight: 500 }}>{job.style}</div>
                                    <div style={{ fontSize: '11px', color: '#666' }}>
                                        {new Date(job.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
                    <Pagination totalPages={totalPages} />
                </div>
            </div>
        </div>
    )
}
