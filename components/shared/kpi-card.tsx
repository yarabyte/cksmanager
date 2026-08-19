import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeType?: "increase" | "decrease" | "neutral"
  changeLabel?: string
  icon: React.ReactNode
  className?: string
}

export function KPICard({
  title,
  value,
  change,
  changeType = "neutral",
  changeLabel,
  icon,
  className,
}: KPICardProps) {
  const changeColors = {
    increase: "text-emerald-600 dark:text-emerald-400",
    decrease: "text-red-600 dark:text-red-400",
    neutral: "text-muted-foreground",
  }

  const ChangeIcon = {
    increase: TrendingUp,
    decrease: TrendingDown,
    neutral: Minus,
  }[changeType]

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {change !== undefined && (
              <div className={cn("flex items-center gap-1 text-sm", changeColors[changeType])}>
                <ChangeIcon className="h-4 w-4" />
                <span className="font-medium">
                  {changeType === "increase" ? "+" : changeType === "decrease" ? "-" : ""}
                  {Math.abs(change)}%
                </span>
                {changeLabel && (
                  <span className="text-muted-foreground">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
