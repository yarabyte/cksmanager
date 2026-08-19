'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listVisitesEligiblesObsObstetricale,
  getObservationObstetricaleByVisiteId,
  upsertObservationObstetricale,
} from '@/app/actions/observation-obstetricale'

export function useVisitesEligiblesObsObstetricale(params?: {
  q?: string
  onlyMissing?: boolean
  page?: number
  pageSize?: number
  periode?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: ['medical', 'obs-obstetricale', 'list', params ?? {}],
    queryFn: () => listVisitesEligiblesObsObstetricale(params),
  })
}

export function useObservationObstetricaleByVisite(
  visiteId: string | undefined,
) {
  return useQuery({
    queryKey: ['medical', 'obs-obstetricale', 'detail', visiteId],
    queryFn: () =>
      visiteId ? getObservationObstetricaleByVisiteId(visiteId) : null,
    enabled: !!visiteId,
  })
}

export function useObservationObstetricaleMutations() {
  const qc = useQueryClient()
  return {
    upsert: useMutation({
      mutationFn: upsertObservationObstetricale,
      onSuccess: (_data, vars) => {
        void qc.invalidateQueries({ queryKey: ['medical', 'obs-obstetricale'] })
        void qc.invalidateQueries({ queryKey: ['visites'] })
        const visiteId =
          vars && typeof vars === 'object' && 'visiteId' in vars
            ? String((vars as { visiteId: string }).visiteId)
            : undefined
        if (visiteId) {
          void qc.invalidateQueries({
            queryKey: ['medical', 'obs-obstetricale', 'detail', visiteId],
          })
        }
      },
    }),
  }
}
