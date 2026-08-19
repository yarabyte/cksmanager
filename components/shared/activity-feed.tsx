"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/formatting"
import { getUserById } from "@/lib/mock-data"
import type { Activity } from "@/lib/types"
import {
  Stethoscope,
  Receipt,
  UserPlus,
  ClipboardList,
} from "lucide-react"

interface ActivityFeedProps {
  activities: Activity[]
  className?: string
}

const activityIcons: Record<Activity["type"], React.ComponentType<{ className?: string }>> = {
  visite: Stethoscope,
  facture: Receipt,
  patient: UserPlus,
  prescription: ClipboardList,
}

const activityColors: Record<Activity["type"], string> = {
  visite: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  facture: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  patient: "bg-primary/10 text-primary",
  prescription: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
}

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Activité récente</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[300px] px-6">
          <div className="space-y-4 pb-4">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type]
              const user = getUserById(activity.userId)
              
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    activityColors[activity.type]
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-relaxed">{activity.message}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatRelativeTime(activity.timestamp)}</span>
                      {user && (
                        <>
                          <span>•</span>
                          <span>{user.firstName} {user.lastName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
