import { ConnectButton } from "@/components/wallet/connect-button"
import Link from "next/link"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold">
              Stakedriven
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/dashboard/polls/create" className="text-sm text-muted-foreground hover:text-foreground">
                Create Poll
              </Link>
              <Link href="/dashboard/projects" className="text-sm text-muted-foreground hover:text-foreground">
                My Projects
              </Link>
            </nav>
          </div>
          <ConnectButton />
        </div>
      </header>
      <main className="container py-8">
        {children}
      </main>
    </div>
  )
}