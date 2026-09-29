"use client"

import { useQuery } from "@tanstack/react-query"
import { getBacFactureNavCount } from "@/app/actions/bac-factures"

export function useBacFactureNavCount(enabled = true) {
  return useQuery({
    queryKey: ["bac-factures", "nav-count"],
    queryFn: getBacFactureNavCount,
    enabled,
    refetchInterval: 30_000,
  })
}
