import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout/Sidebar"
import { DashboardHeader } from "@/components/layout/DashboardHeader"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Middleware handles this redirect, but this is a safety net for
  // direct Server Component renders where middleware may not have run.
  if (!user) {
    redirect("/login")
  }

  const { count: errorCount } = await supabase
    .from("error_pool")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar errorCount={errorCount ?? 0} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardHeader userEmail={user.email} />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
