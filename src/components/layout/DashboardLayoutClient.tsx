"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { DashboardHeader } from "@/components/layout/DashboardHeader"

interface DashboardLayoutClientProps {
  children: React.ReactNode
  userEmail: string | undefined
  errorCount: number
}

export function DashboardLayoutClient({
  children,
  userEmail,
  errorCount,
}: DashboardLayoutClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        errorCount={errorCount}
        isMobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardHeader
          userEmail={userEmail}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
