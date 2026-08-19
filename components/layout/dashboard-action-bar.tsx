import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function DashboardActionBar({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "fixed bottom-0 right-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80",
        "left-[var(--dashboard-sidebar-offset,0px)] transition-[left] duration-300",
        className,
      )}
    >
      {children}
    </div>
  )
}
