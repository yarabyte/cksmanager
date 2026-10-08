"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { getBacFactureNavCount } from "@/app/actions/bac-factures"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const TABS = [
  {
    href: "/facturation",
    label: "Factures",
    match: (p: string) =>
      p === "/facturation" ||
      p.startsWith("/facturation/nouvelle") ||
      /^\/facturation\/\d+/.test(p),
  },
  {
    href: "/facturation/avoirs",
    label: "Avoirs",
    match: (p: string) => p.startsWith("/facturation/avoirs"),
  },
  {
    href: "/facturation/bac",
    label: "Bac à facture",
    match: (p: string) => p.startsWith("/facturation/bac"),
    showBadge: true,
  },
  {
    href: "/facturation/bordereaux",
    label: "Bordereaux",
    match: (p: string) => p.startsWith("/facturation/bordereaux"),
    bordereauxOnly: true,
  },
  {
    href: "/facturation/recouvrement",
    label: "Recouvrement",
    match: (p: string) => p.startsWith("/facturation/recouvrement"),
  },
  {
    href: "/facturation/paye",
    label: "Payé",
    match: (p: string) => p.startsWith("/facturation/paye"),
  },
] as const

export function FacturationTabs({ showBordereaux = true }: { showBordereaux?: boolean }) {
  const pathname = usePathname()
  const { data: bacCount } = useQuery({
    queryKey: ["bac-factures", "nav-count"],
    queryFn: getBacFactureNavCount,
    refetchInterval: 30_000,
  })

  const tabs = TABS.filter((t) => !("bordereauxOnly" in t && t.bordereauxOnly) || showBordereaux)

  return (
    <div className="flex gap-1 border-b border-gray-100">
      {tabs.map((tab) => {
        const active = tab.match(pathname)
        const showBadge = "showBadge" in tab && tab.showBadge && bacCount != null && bacCount > 0
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
              active
                ? "border-[#cd3b86] text-[#cd3b86]"
                : "border-transparent text-gray-500 hover:text-gray-800",
            )}
          >
            {tab.label}
            {showBadge ? (
              <Badge
                variant="secondary"
                className="h-5 min-w-5 px-1.5 text-xs tabular-nums border-[#cd3b86]/25 bg-[#cd3b86]/10 text-[#cd3b86]"
              >
                {bacCount}
              </Badge>
            ) : null}
          </Link>
        )
      })}
    </div>
  )
}
