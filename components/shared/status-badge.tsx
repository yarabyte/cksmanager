import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getVisiteStatusConfig, getFactureStatusConfig, getRoleConfig } from "@/lib/formatting"
import type { VisiteStatus, FactureStatus, Role } from "@/lib/types"

interface VisiteStatusBadgeProps {
  status: VisiteStatus
  className?: string
}

export function VisiteStatusBadge({ status, className }: VisiteStatusBadgeProps) {
  const config = getVisiteStatusConfig(status)
  return (
    <Badge 
      variant="secondary" 
      className={cn("font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

interface FactureStatusBadgeProps {
  status: FactureStatus
  className?: string
}

export function FactureStatusBadge({ status, className }: FactureStatusBadgeProps) {
  const config = getFactureStatusConfig(status)
  return (
    <Badge 
      variant="secondary" 
      className={cn("font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

interface RoleBadgeProps {
  role: Role
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = getRoleConfig(role)
  return (
    <Badge 
      variant="secondary" 
      className={cn("font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
