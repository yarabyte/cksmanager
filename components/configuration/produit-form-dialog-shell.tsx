"use client"

import * as React from "react"
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export function ProduitFormDialogShell({
  title,
  description,
  icon: Icon,
  children,
  footer,
  className,
}: {
  title: string
  description: string
  icon: React.ElementType
  children: React.ReactNode
  footer: React.ReactNode
  className?: string
}) {
  return (
    <DialogContent
      className={cn(
        "flex max-h-[min(92vh,820px)] w-full flex-col gap-0 overflow-hidden rounded-2xl border-gray-100 p-0 shadow-xl sm:max-w-2xl",
        className,
      )}
    >
      <div className="relative shrink-0 border-b border-gray-100 px-6 pb-4 pt-6">
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#cd3b86] via-[#e879b3] to-[#cd3b86]" />
        <div className="flex items-start gap-3 pr-8">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/10 text-[#cd3b86]">
            <Icon className="h-5 w-5" />
          </div>
          <DialogHeader className="space-y-1 p-0 text-left">
            <DialogTitle className="font-['DM_Sans',sans-serif] text-xl font-bold text-gray-900">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

      <DialogFooter className="shrink-0 gap-2 border-t border-gray-100 bg-gray-50/70 px-6 py-4 sm:justify-end">
        {footer}
      </DialogFooter>
    </DialogContent>
  )
}
