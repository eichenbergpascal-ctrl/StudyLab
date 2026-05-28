import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayoutClient } from "@/components/layout/DashboardLayoutClient"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Proxy is the primary auth guard — this is a secondary safety net
  // for Server Component renders that bypass the proxy (e.g. RSC prefetch).
  if (!user) {
    redirect("/login")
  }

  const { count: errorCount } = await supabase
    .from("error_pool")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  return (
    <DashboardLayoutClient userEmail={user.email} errorCount={errorCount ?? 0}>
      {children}
    </DashboardLayoutClient>
  )
}
