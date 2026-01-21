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
        orderBy: { createdAt: 'asc' },
        take: 50 // Limit to prevent page bloat
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
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-10">
            <div className="max-w-[1400px] mx-auto">
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px', color: '#D4AF37' }}>
                    Admin Console
                </h1>

                {/* Dashboard Stats / Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 mb-10">
                    {/* Activity Monitor */}
                    <div className="bg-[#111] rounded-2xl border border-[#222] p-6">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-lg font-semibold text-[#D4AF37]">Recent Activity</h2>
                            <div className="text-xs text-[#666]">Last 10 results</div>
                        </div>

                        <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {completedJobs.length === 0 ? (
                                <div className="text-center py-10 text-[#444]">No recent activity</div>
                            ) : completedJobs.map(job => (
                                <div key={job.id} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3 flex gap-4 items-center">
                                    {/* Small Image Preview Bundle */}
                                    <div className="flex gap-1 h-[60px] shrink-0">
                                        <div className="w-[60px] rounded overflow-hidden bg-[#111]">
                                            <img
                                                src={`/api/images?id=${job.id}&type=thumb`}
                                                className="w-full h-full object-cover"
                                                alt="Original"
                                            />
                                        </div>
                                        <div className="w-[60px] rounded overflow-hidden bg-[#111] border border-[#D4AF37]">
                                            {job.status === 'COMPLETED' ? (
                                                <img
                                                    src={`/api/images?id=${job.id}&type=result`}
                                                    className="w-full h-full object-cover"
                                                    alt="Result"
                                                />
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-[10px] text-[#ff4444]">FAIL</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <Link href={`/admin/user/${job.user.id}`} className="text-[13px] font-semibold text-blue-500 hover:text-blue-400 truncate max-w-[120px]">
                                                {job.user.username}
                                            </Link>
                                            <span className="text-[10px] text-[#666] shrink-0">{new Date(job.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="text-xs text-[#888] mt-1 truncate">
                                            {job.style} · <span className={job.status === 'COMPLETED' ? 'text-[#4CAF50]' : 'text-[#ff4444]'}>{job.status}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-5">
                        {/* Queue Monitor */}
                        <div className="bg-[#111] rounded-2xl border border-[#222] p-5">
                            <h2 className="text-base mb-4 text-[#888]">Live Queue ({pendingJobs.length})</h2>
                            <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                {pendingJobs.length === 0 ? <span className="text-[#444]">No pending jobs</span> : pendingJobs.map(job => (
                                    <div key={job.id} className="flex items-center justify-between py-2 border-b border-[#222] last:border-0">
                                        <div className="flex items-center gap-2">
                                            {job.status === 'PROCESSING' ? <Loader2 size={14} className="animate-spin text-[#D4AF37]" /> : <div className="w-1.5 h-1.5 rounded-full bg-[#666]" />}
                                            <span className="text-[13px]">{job.style}</span>
                                        </div>
                                        <span className="text-[12px] text-[#666]">{job.user.username}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Recharge */}
                        <div className="bg-[#D4AF37]/5 rounded-2xl border border-[#D4AF37]/20 p-5">
                            <h2 className="text-base mb-4 text-[#D4AF37]">Fast Recharge</h2>
                            <form action={addCredits} className="flex gap-2">
                                <input name="username" placeholder="Username" className="flex-1 bg-black border border-[#333] text-white p-2.5 rounded-lg text-[13px] focus:border-[#D4AF37] outline-none" required />
                                <input name="amount" type="number" defaultValue="100" className="w-20 bg-black border border-[#333] text-white p-2.5 rounded-lg text-[13px] focus:border-[#D4AF37] outline-none" required />
                                <button type="submit" className="bg-[#D4AF37] text-black font-semibold px-5 rounded-lg border-0 cursor-pointer text-[13px] hover:bg-[#B8962E] transition-colors">Add</button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* User Management Section */}
                <div className="bg-[#111] rounded-2xl border border-[#222] overflow-hidden">
                    <div className="p-5 border-b border-[#222] flex flex-col md:flex-row justify-between items-center gap-4">
                        <h2 className="text-lg font-semibold">User Management ({totalUsers})</h2>
                        <div className="w-full md:w-auto">
                            <SearchInput placeholder="Search users by name..." />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead className="bg-[#1a1a1a] text-[#888] text-left">
                                <tr>
                                    <th className="p-4 font-medium whitespace-nowrap">User</th>
                                    <th className="p-4 font-medium whitespace-nowrap">Credits</th>
                                    <th className="p-4 font-medium whitespace-nowrap">Role</th>
                                    <th className="p-4 font-medium whitespace-nowrap">Joined</th>
                                    <th className="p-4 font-medium text-right whitespace-nowrap">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="border-b border-[#222] text-[#ddd] hover:bg-[#1a1a1a] transition-colors">
                                        <td className="p-4">
                                            <Link href={`/admin/user/${u.id}`} className="text-blue-500 hover:text-blue-400 font-medium no-underline">
                                                {u.username}
                                            </Link>
                                        </td>
                                        <td className="p-4">
                                            <span className={u.credits > 0 ? 'text-[#4CAF50] font-semibold' : 'text-[#ff4444] font-semibold'}>{u.credits}</span>
                                        </td>
                                        <td className="p-4">
                                            {u.role === 'ADMIN' ? (
                                                <span className="text-[#D4AF37] text-[10px] border border-[#D4AF37] px-1.5 py-0.5 rounded">ADMIN</span>
                                            ) : (
                                                <span className="text-[#666]">USER</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-[#666] text-[13px] whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 text-right">
                                            <form action={addCredits} className="inline-flex gap-2">
                                                <input type="hidden" name="username" value={u.username} />
                                                <input type="hidden" name="amount" value="50" />
                                                <button type="submit" className="text-xs text-[#D4AF37] bg-transparent border border-[#D4AF37] px-2.5 py-1 rounded hover:bg-[#D4AF37]/10 transition-colors cursor-pointer">
                                                    +50
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-5 border-t border-[#222]">
                        <Pagination totalPages={totalPages} />
                    </div>
                </div>
            </div>
        </div>
    )
}
