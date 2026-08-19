'use client'

import { useQuery } from '@tanstack/react-query'
import { getSortiesNavCount } from '@/app/actions/pharmacie-sortie'

export function useSortiesNavCount(enabled = true) {
  return useQuery({
    queryKey: ['pharmacie', 'sorties', 'nav-count'],
    queryFn: getSortiesNavCount,
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}
