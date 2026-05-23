"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DashboardHeaderProps {
  userEmail: string | undefined
}

export function DashboardHeader({ userEmail }: DashboardHeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : "??"

  return (
    <header className="h-14 flex items-center justify-end px-6 border-b border-border bg-card shrink-0">
      <DropdownMenu>
        {/* base-ui DropdownMenuTrigger renders as <button> — no asChild needed */}
        <DropdownMenuTrigger
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Benutzermenü"
        >
          <Avatar className="size-7">
            <AvatarFallback className="text-xs font-medium bg-blue-100 text-blue-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[180px] truncate text-sm text-muted-foreground hidden sm:block">
            {userEmail}
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          <div className="px-2 py-1.5">
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            variant="destructive"
            className="cursor-pointer"
          >
            <LogOut className="mr-2 size-4" strokeWidth={2} />
            Abmelden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
