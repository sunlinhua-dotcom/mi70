import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ClientDashboard from "./client-dashboard"
import Header from "@/components/Header"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.name) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { username: session.user.name }
  })

  if (!user) {
    redirect('/api/auth/signout')
  }

  const isSuperUser = user.role === 'ADMIN' || user.username === 'sbrain'

  return (
    <main className="min-h-screen bg-[#000000] text-white relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#C9A962]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#C9A962]/5 rounded-full blur-[100px]" />
      </div>

      {/* Client Header with Logout */}
      <Header user={user} isSuperUser={isSuperUser} />

      {/* Content */}
      <div className="relative z-10 max-w-lg mx-auto px-6 py-8">
        <ClientDashboard userCredits={user.credits} isSuperUser={isSuperUser} />
      </div>
    </main>
  )
}
