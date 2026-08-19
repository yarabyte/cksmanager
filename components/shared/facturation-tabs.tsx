"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/facturation", label: "Factures", match: (p: string) => p === "/facturation" || p.startsWith("/facturation/nouvelle") || /^\/facturation\/\d+/.test(p) },
  {
    href: "/facturation/bordereaux",
    label: "Bordereaux assureurs",
    match: (p: string) => p.startsWith("/facturation/bordereaux"),
  },
] as const

export function FacturationTabs({ showBordereaux = true }: { showBordereaux?: boolean }) {
  const pathname = usePathname()
  const tabs = showBordereaux ? TABS : TABS.filter((t) => t.href === "/facturation")

  return (
    <div className="flex gap-1 border-b border-gray-100">
      {tabs.map((tab) => {
        const active = tab.match(pathname)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
              active
                ? "border-[#cd3b86] text-[#cd3b86]"
                : "border-transparent text-gray-500 hover:text-gray-800",
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
