"use client"

import * as React from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import type { PermissionMatrix } from "@/lib/permissions-matrix"

interface DashboardLayoutProps {
  children: React.ReactNode
  user: import("@/lib/auth/types").SidebarUser
  permissionMatrix: PermissionMatrix
}

export function DashboardLayout({ children, user, permissionMatrix }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const isMobile = useIsMobile()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
        user={user}
        permissionMatrix={permissionMatrix}
      />
      
      {/* Main content area */}
      <div
        className={cn(
          "flex flex-1 flex-col overflow-hidden transition-all duration-300",
          !isMobile && (sidebarCollapsed ? "ml-16" : "ml-64"),
        )}
        style={
          {
            "--dashboard-sidebar-offset": isMobile
              ? "0px"
              : sidebarCollapsed
                ? "4rem"
                : "16rem",
          } as React.CSSProperties
        }
      >
        {/* Header */}
        <Header 
          onMenuClick={() => setMobileMenuOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          user={user}
        />
        
        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
