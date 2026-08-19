"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, CheckCheck, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/formatting"
import {
  useNotificationMutations,
  useNotificationsList,
} from "@/hooks/use-notifications"

const PAGE_SIZE = 20

export function NotificationsPageClient() {
  const router = useRouter()
  const [page, setPage] = React.useState(1)
  const [onlyUnread, setOnlyUnread] = React.useState(false)
  const { data, isLoading, error } = useNotificationsList({
    page,
    pageSize: PAGE_SIZE,
    onlyUnread: onlyUnread || undefined,
  })
  const { markRead, markAllRead } = useNotificationMutations()

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const unreadCount = data?.unreadCount ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  React.useEffect(() => {
    setPage(1)
  }, [onlyUnread])

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  async function handleClick(notif: {
    id: string
    href: string | null
    readAt: string | null
  }) {
    if (!notif.readAt) {
      await markRead.mutateAsync(notif.id)
    }
    if (notif.href) router.push(notif.href)
  }

  async function handleMarkAll() {
    const res = await markAllRead.mutateAsync()
    if (res.ok) {
      toast.success(
        res.count > 0
          ? `${res.count} notification${res.count > 1 ? "s" : ""} marquée${res.count > 1 ? "s" : ""} comme lue${res.count > 1 ? "s" : ""}`
          : "Aucune notification non lue",
      )
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#cd3b86]">
            Activité
          </p>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 font-['DM_Sans',sans-serif]">
            <Bell className="h-7 w-7 text-gray-700" />
            Notifications
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount > 0
              ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
              : "Tout est à jour"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="only-unread"
              checked={onlyUnread}
              onCheckedChange={setOnlyUnread}
            />
            <Label htmlFor="only-unread" className="cursor-pointer text-sm text-gray-600">
              Non lues uniquement
            </Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg"
            disabled={markAllRead.isPending || unreadCount === 0}
            onClick={() => void handleMarkAll()}
          >
            {markAllRead.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Tout marquer comme lu
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        {error ? (
          <p className="px-5 py-10 text-center text-sm text-red-600">
            {error instanceof Error ? error.message : "Erreur de chargement"}
          </p>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement…
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Bell className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-700">Aucune notification</p>
            <p className="mt-1 text-sm text-gray-500">
              {onlyUnread
                ? "Vous n’avez aucune notification non lue."
                : "Les événements métier apparaîtront ici."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {items.map((notif) => (
              <li key={notif.recipientId}>
                <button
                  type="button"
                  onClick={() => void handleClick(notif)}
                  className={cn(
                    "flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50/80",
                    !notif.readAt && "bg-[#cd3b86]/[0.03]",
                  )}
                >
                  {!notif.readAt ? (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#cd3b86]" />
                  ) : (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-transparent" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm text-gray-800",
                        !notif.readAt && "font-semibold",
                      )}
                    >
                      {notif.message}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                      {!notif.readAt && (
                        <Badge
                          variant="secondary"
                          className="h-5 rounded-full px-2 text-[10px] font-medium"
                        >
                          Nouveau
                        </Badge>
                      )}
                      {notif.href && (
                        <span className="text-[11px] text-[#cd3b86]">Ouvrir →</span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <p className="text-xs text-gray-500">
              Page {page} / {totalPages} · {total} au total
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400">
        <Link href="/" className="hover:text-gray-600">
          Retour au tableau de bord
        </Link>
      </p>
    </div>
  )
}
