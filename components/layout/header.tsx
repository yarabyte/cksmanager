"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Input } from "@/components/ui/input"
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  UserPlus,
  CalendarPlus,
  FilePlus,
  ChevronDown,
  LogOut,
  CheckCheck,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { breadcrumbLabels } from "@/lib/navigation"
import { formatRelativeTime, getInitials, getRoleConfig } from "@/lib/formatting"
import { useIsMobile } from "@/hooks/use-mobile"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { SidebarUser } from "@/lib/auth/types"
import {
  useNotificationMutations,
  useRecentNotifications,
} from "@/hooks/use-notifications"

interface HeaderProps {
  onMenuClick: () => void
  sidebarCollapsed: boolean
  user: SidebarUser
}

export function Header({ onMenuClick, sidebarCollapsed, user }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const isMobile = useIsMobile()
  const [mounted, setMounted] = React.useState(false)
  const roleConfig = user.customGroup
    ? { label: user.customGroup.label, className: "bg-slate-100 text-slate-700 border border-slate-200" }
    : getRoleConfig(user.role)
  const initials = getInitials(user.firstName, user.lastName)

  const { data: notifData, isPending: notifLoading } = useRecentNotifications()
  const { markRead, markAllRead } = useNotificationMutations()
  const recentNotifications = notifData?.items ?? []
  const unreadCount = notifData?.unreadCount ?? 0

  React.useEffect(() => {
    setMounted(true)
  }, [])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  async function handleNotifClick(notif: {
    id: string
    href: string | null
    readAt: string | null
  }) {
    if (!notif.readAt) {
      await markRead.mutateAsync(notif.id)
    }
    if (notif.href) {
      router.push(notif.href)
    }
  }

  // Generate breadcrumbs from pathname
  const pathSegments = pathname.split("/").filter(Boolean)
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/")
    const label = breadcrumbLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    const isLast = index === pathSegments.length - 1
    return { href, label, isLast }
  })

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-4 md:px-6">
      {/* Mobile menu button */}
      {isMobile && (
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      )}

      {/* Breadcrumbs */}
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Mobile title */}
      {isMobile && breadcrumbs.length > 0 && (
        <h1 className="text-lg font-semibold md:hidden">
          {breadcrumbs[breadcrumbs.length - 1]?.label}
        </h1>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden w-64 lg:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher..."
          className="h-9 pl-9 pr-4"
        />
      </div>

      {/* Quick actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm" className="hidden gap-2 sm:flex">
            <Plus className="h-4 w-4" />
            <span className="hidden lg:inline">Nouveau</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Actions rapides</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UserPlus className="mr-2 h-4 w-4" />
            Nouveau patient
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Nouvelle visite
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FilePlus className="mr-2 h-4 w-4" />
            Nouvelle facture
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-[10px]"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between gap-2">
            <span>Notifications</span>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""}
                </Badge>
              )}
              {unreadCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px] text-muted-foreground"
                  disabled={markAllRead.isPending}
                  onClick={(e) => {
                    e.preventDefault()
                    void markAllRead.mutateAsync()
                  }}
                >
                  <CheckCheck className="mr-1 h-3.5 w-3.5" />
                  Tout lu
                </Button>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-80 overflow-auto">
            {notifLoading ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Chargement…
              </p>
            ) : recentNotifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Aucune notification
              </p>
            ) : (
              recentNotifications.map((notif) => (
                <DropdownMenuItem
                  key={notif.recipientId}
                  className={cn(
                    "flex cursor-pointer flex-col items-start gap-1 p-3",
                    !notif.readAt && "bg-[#cd3b86]/[0.04]",
                  )}
                  onSelect={(e) => {
                    e.preventDefault()
                    void handleNotifClick(notif)
                  }}
                >
                  <div className="flex w-full items-start gap-2">
                    {!notif.readAt ? (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#cd3b86]" />
                    ) : (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm leading-snug",
                          !notif.readAt && "font-medium text-foreground",
                        )}
                      >
                        {notif.message}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatRelativeTime(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="justify-center text-primary">
            <Link href="/notifications">Voir toutes les notifications</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Theme toggle */}
      {mounted && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span className="sr-only">Changer le thème</span>
        </Button>
      )}

      {/* Utilisateur connecté */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-9 gap-2 rounded-full pl-1 pr-2 hover:bg-accent"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#cd3b86]/10 text-[#cd3b86] text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">
              {user.firstName}
            </span>
            <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
            <span className="sr-only">Menu utilisateur</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium leading-none">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <Badge
                variant="secondary"
                className={cn("mt-1 w-fit text-[10px] font-medium", roleConfig.className)}
              >
                {roleConfig.label}
              </Badge>
            </div>
          </DropdownMenuLabel>
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
    </header>
  )
}
