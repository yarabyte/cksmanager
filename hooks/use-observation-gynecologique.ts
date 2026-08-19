'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listVisitesEligiblesObsGyneco,
  getObservationGynecologiqueByVisiteId,
  upsertObservationGynecologique,
} from '@/app/actions/observation-gynecologique'

export function useVisitesEligiblesObsGyneco(params?: {
  q?: string
  onlyMissing?: boolean
  page?: number
  pageSize?: number
  periode?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: ['medical', 'obs-gyneco', 'list', params ?? {}],
    queryFn: () => listVisitesEligiblesObsGyneco(params),
  })
}

export function useObservationGynecologiqueByVisite(
  visiteId: string | undefined,
) {
  return useQuery({
    queryKey: ['medical', 'obs-gyneco', 'detail', visiteId],
    queryFn: () =>
      visiteId ? getObservationGynecologiqueByVisiteId(visiteId) : null,
    enabled: !!visiteId,
  })
}

export function useObservationGynecologiqueMutations() {
  const qc = useQueryClient()
  return {
    upsert: useMutation({
      mutationFn: upsertObservationGynecologique,
      onSuccess: (_data, vars) => {
        void qc.invalidateQueries({ queryKey: ['medical', 'obs-gyneco'] })
        void qc.invalidateQueries({ queryKey: ['visites'] })
        const visiteId =
          vars && typeof vars === 'object' && 'visiteId' in vars
            ? String((vars as { visiteId: string }).visiteId)
            : undefined
        if (visiteId) {
          void qc.invalidateQueries({
            queryKey: ['medical', 'obs-gyneco', 'detail', visiteId],
          })
        }
      },
    }),
  }
}
