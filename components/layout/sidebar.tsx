"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Receipt,
  Pill,
  Wallet,
  FileText,
  Building2,
  UserCog,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  ChevronDown,
  Minus,
  BarChart3,
  Calendar,
  ClipboardList,
  BedDouble,
  CalendarCheck,
  UserPlus,
  CreditCard,
  Shield,
  Lock,
  Package,
  ShoppingCart,
  ClipboardCheck,
  LayoutGrid,
  ScrollText,
  BookOpen,
  Layers,
  ArrowUpFromLine,
  Truck,
  Warehouse,
  ArrowLeftRight,
  PackageCheck,
  Undo2,
  Activity,
  Clock,
  FolderHeart,
  Flower2,
  Baby,
  Inbox,
} from "lucide-react"
import type { SidebarUser } from "@/lib/auth/types"
import {
  getNavigationForRoles,
  filterNavGroupsByPermissions,
  getNavigationForCustomGroup,
} from "@/lib/navigation"
import { getRoleConfig, getInitials } from "@/lib/formatting"
import { canValiderSortie } from "@/lib/pharmacie/roles"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSortiesNavCount } from "@/hooks/use-sorties-nav"
import { useSalleAttenteNavCount } from "@/hooks/use-parametres-patient"
import { useVisiteNavCount } from "@/hooks/use-visites"
import { useBacFactureNavCount } from "@/hooks/use-bac-facture-nav"
import type { NavGroup, NavItem } from "@/lib/types"
import type { PermissionMatrix } from "@/lib/permissions-matrix"

interface SidebarProps {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  mobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
  user: SidebarUser
  permissionMatrix: PermissionMatrix
}

function withNavBadges(
  groups: NavGroup[],
  badges: Partial<Record<string, number | undefined>>,
): NavGroup[] {
  function applyItem(item: NavItem): NavItem {
    const badge = badges[item.href]
    if (!item.children?.length) {
      return badge != null ? { ...item, badge } : item
    }
    return {
      ...item,
      children: item.children.map((child) => {
        const childBadge = badges[child.href]
        return childBadge != null ? { ...child, badge: childBadge } : child
      }),
    }
  }

  return groups.map((group) => ({
    ...group,
    items: group.items.map(applyItem),
  }))
}

/** @deprecated Utiliser withNavBadges */
function withVisiteMenuBadge(groups: NavGroup[], todayCount: number | undefined) {
  return withNavBadges(groups, { "/visites": todayCount })
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Stethoscope,
  Receipt,
  Pill,
  Wallet,
  FileText,
  Building2,
  UserCog,
  BarChart3,
  Calendar,
  ClipboardList,
  BedDouble,
  CalendarCheck,
  UserPlus,
  CreditCard,
  Shield,
  Lock,
  Package,
  ShoppingCart,
  ClipboardCheck,
  LayoutGrid,
  ScrollText,
  Settings,
  BookOpen,
  Layers,
  ArrowUpFromLine,
  Truck,
  Warehouse,
  ArrowLeftRight,
  PackageCheck,
  Undo2,
  Activity,
  Clock,
  FolderHeart,
  Flower2,
  Baby,
  Inbox,
}

function NavItemCountBadge({ href, badge }: { href: string; badge?: number }) {
  if (badge == null) return null
  if (href === "/pharmacie/sorties" && badge <= 0) return null
  if (href === "/medical/salle-attente" && badge <= 0) return null
  if (href === "/facturation/bac" && badge <= 0) return null
  return (
    <Badge
      variant="secondary"
      className={cn(
        "h-5 min-w-5 px-1.5 text-xs tabular-nums",
        href === "/visites" && badge > 0 && "border-[#cd3b86]/25 bg-[#cd3b86]/10 text-[#cd3b86]",
        href === "/pharmacie/sorties" && "border-amber-300 bg-amber-50 text-amber-800",
        href === "/medical/salle-attente" &&
          "border-blue-200 bg-blue-50 text-blue-700",
        href === "/facturation/bac" &&
          "border-[#cd3b86]/25 bg-[#cd3b86]/10 text-[#cd3b86]",
      )}
    >
      {badge}
    </Badge>
  )
}

function isNavHrefActive(pathname: string, href: string, siblingHrefs: string[] = []) {
  if (pathname === href) return true
  if (!pathname.startsWith(href + "/")) return false
  return !siblingHrefs.some(
    (s) =>
      s !== href &&
      s.startsWith(href + "/") &&
      (pathname === s || pathname.startsWith(s + "/")),
  )
}

function isNavItemOrChildActive(pathname: string, item: NavItem): boolean {
  if (item.children?.length) {
    const siblingHrefs = item.children.map((c) => c.href)
    return item.children.some((child) =>
      isNavHrefActive(pathname, child.href, siblingHrefs),
    )
  }
  return isNavHrefActive(pathname, item.href)
}

function SidebarNavItem({
  item,
  collapsed,
  pathname,
  onItemClick,
}: {
  item: NavItem
  collapsed: boolean
  pathname: string
  onItemClick?: () => void
}) {
  const Icon = iconMap[item.icon] || LayoutDashboard
  const hasChildren = Boolean(item.children?.length)
  const isActive = isNavItemOrChildActive(pathname, item)

  if (hasChildren && item.children) {
    const siblingHrefs = item.children.map((c) => c.href)

    if (collapsed) {
      return (
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-center rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                  <span className="sr-only">{item.label}</span>
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="right" align="start" className="w-56">
            {item.children.map((child) => {
              const childActive = isNavHrefActive(pathname, child.href, siblingHrefs)
              return (
                <DropdownMenuItem key={child.href} asChild>
                  <Link
                    href={child.href}
                    onClick={onItemClick}
                    className={cn("flex items-center justify-between gap-2", childActive && "bg-accent")}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Minus className="h-3 w-3 shrink-0 text-muted-foreground" />
                      {child.label}
                    </span>
                    <NavItemCountBadge href={child.href} badge={child.badge} />
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    return (
      <Collapsible defaultOpen={isActive} className="group/collapsible">
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50",
          )}
        >
          <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-0.5 space-y-0.5">
          {item.children.map((child) => {
            const childActive = isNavHrefActive(pathname, child.href, siblingHrefs)
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onItemClick}
                className={cn(
                  "flex items-center gap-2 rounded-lg py-2 pl-9 pr-3 text-sm transition-colors",
                  childActive
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <Minus className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="flex-1">{child.label}</span>
                <NavItemCountBadge href={child.href} badge={child.badge} />
              </Link>
            )
          })}
        </CollapsibleContent>
      </Collapsible>
    )
  }

  const linkContent = (
    <Link
      href={item.href}
      onClick={onItemClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          <NavItemCountBadge href={item.href} badge={item.badge} />
        </>
      )}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.label}
          <NavItemCountBadge href={item.href} badge={item.badge} />
        </TooltipContent>
      </Tooltip>
    )
  }

  return linkContent
}

function SidebarContent({
  collapsed,
  onCollapsedChange,
  onItemClick,
  user,
  permissionMatrix,
}: {
  collapsed: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  onItemClick?: () => void
  user: SidebarUser
  permissionMatrix: PermissionMatrix
}) {
  const pathname = usePathname()
  const { data: visiteStats } = useVisiteNavCount()
  const showSortiesBadge = canValiderSortie(user.roles?.length ? user.roles : [user.role])
  const { data: sortiesCount } = useSortiesNavCount(showSortiesBadge)
  const roles = user.roles?.length ? user.roles : [user.role]
  const showSalleAttenteBadge = roles.some((r) =>
    ["Admin", "Manager", "Médecin", "Sage femme"].includes(r),
  )
  const { data: salleAttenteCount } = useSalleAttenteNavCount(showSalleAttenteBadge)
  const showBacBadge = roles.some((r) =>
    ["Admin", "Manager", "Caisse"].includes(r),
  )
  const { data: bacCount } = useBacFactureNavCount(showBacBadge)
  const baseGroups = user.customGroup
    ? getNavigationForCustomGroup(user.customGroup)
    : filterNavGroupsByPermissions(getNavigationForRoles(roles), permissionMatrix, roles)
  const navGroups = withNavBadges(baseGroups, {
    "/visites": visiteStats?.aujourd_hui,
    "/pharmacie/sorties": sortiesCount,
    "/medical/salle-attente": salleAttenteCount,
    "/facturation/bac": bacCount,
  })
  const roleConfig = user.customGroup
    ? { label: user.customGroup.label, className: "bg-slate-100 text-slate-700 border border-slate-200" }
    : getRoleConfig(user.role)

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b border-sidebar-border/80 px-4",
        "bg-gradient-to-b from-white/40 to-transparent dark:from-white/[0.03]",
        collapsed ? "justify-center" : "justify-between"
      )}>
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onItemClick}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-700 shadow-sm shadow-primary/20">
            <span className="text-sm font-bold text-primary-foreground">CKS</span>
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-foreground tracking-tight">Manager</span>
          )}
        </Link>
        {!collapsed && onCollapsedChange && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-8 w-8 md:flex"
            onClick={() => onCollapsedChange(true)}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Réduire le menu</span>
          </Button>
        )}
      </div>

      {/* Navigation — min-h-0 pour scroller quand un sous-menu est ouvert */}
      <ScrollArea className="min-h-0 flex-1 overflow-hidden px-3 py-4">
        <TooltipProvider delayDuration={0}>
          <nav className="flex flex-col gap-1">
            {navGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-4">
                {group.label && !collapsed && (
                  <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </div>
                )}
                {group.items.map((item) => (
                  <SidebarNavItem
                    key={item.href + item.label}
                    item={item}
                    collapsed={collapsed}
                    pathname={pathname}
                    onItemClick={onItemClick}
                  />
                ))}
              </div>
            ))}
          </nav>
        </TooltipProvider>
      </ScrollArea>

      {/* Expand button when collapsed */}
      {collapsed && onCollapsedChange && (
        <div className="hidden border-t border-sidebar-border p-2 md:block">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-full"
            onClick={() => onCollapsedChange(false)}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Étendre le menu</span>
          </Button>
        </div>
      )}

      {/* User profile */}
      <div className={cn(
        "border-t border-sidebar-border p-3",
        collapsed && "flex justify-center p-2"
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "h-auto w-full justify-start gap-3 p-2 hover:bg-sidebar-accent/50",
                collapsed && "w-auto justify-center p-2"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="flex flex-1 flex-col items-start text-left">
                    <span className="text-sm font-medium text-sidebar-foreground">
                      {user.firstName} {user.lastName}
                    </span>
                    <Badge 
                      variant="secondary" 
                      className={cn("mt-0.5 h-5 px-1.5 text-[10px] font-medium", roleConfig.className)}
                    >
                      {roleConfig.label}
                    </Badge>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={collapsed ? "center" : "end"} side="top" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => void handleLogout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function Sidebar({
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileOpenChange,
  user,
  permissionMatrix,
}: SidebarProps) {
  const isMobile = useIsMobile()

  // Mobile: Sheet drawer
  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          className="sidebar-surface w-64 border-sidebar-border p-0 [&>button]:hidden"
        >
          <SidebarContent
            collapsed={false}
            onItemClick={() => onMobileOpenChange(false)}
            user={user}
            permissionMatrix={permissionMatrix}
          />
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop: Fixed sidebar
  return (
    <aside className={cn(
      "sidebar-surface fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <SidebarContent
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
        user={user}
        permissionMatrix={permissionMatrix}
      />
    </aside>
  )
}
