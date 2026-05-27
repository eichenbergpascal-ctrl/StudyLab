"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  AlertCircle,
  CheckSquare,
  FileText,
  LayoutGrid,
  Layers,
  PanelLeft,
  TrendingUp,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const navItems = [
  { label: "Dashboard",      href: "/",               icon: LayoutGrid  },
  { label: "Klausuren",      href: "/klausuren",      icon: FileText    },
  { label: "Karteikarten",   href: "/karteikarten",   icon: Layers      },
  { label: "Probeklausuren", href: "/probeklausuren", icon: CheckSquare },
  { label: "Fehler-Pool",    href: "/fehler",         icon: AlertCircle, badge: true },
  { label: "Fortschritt",    href: "/fortschritt",    icon: TrendingUp  },
  { label: "Lerngruppen",    href: "/gruppen",        icon: Users       },
]

export function Sidebar({ errorCount = 0 }: { errorCount?: number }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card border-r border-border transition-all duration-150",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo + toggle */}
      <div className="flex items-center px-3 py-4 gap-2 min-h-[56px]">
        {!collapsed && (
          <Link href="/" className="flex-1 flex items-center pl-1">
            <Image src="/logo.svg" alt="StudyLab" width={112} height={26} priority />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("shrink-0 text-muted-foreground hover:text-foreground", collapsed && "mx-auto")}
          aria-label={collapsed ? "Sidebar ausklappen" : "Sidebar einklappen"}
        >
          <PanelLeft className="size-4" strokeWidth={2} />
        </Button>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)
          const showBadge = badge && errorCount > 0
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors duration-100",
                isActive
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon
                className={cn(
                  "shrink-0 size-4",
                  isActive ? "text-blue-600" : "text-slate-400"
                )}
                strokeWidth={2}
              />
              {!collapsed && (
                <>
                  <span className="flex-1">{label}</span>
                  {showBadge && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#DC4A4A] px-1.5 font-mono text-[10px] font-medium text-white">
                      {errorCount > 99 ? "99+" : errorCount}
                    </span>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
