'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listVisitesEligiblesParametres,
  getParametrePatientByVisiteId,
  upsertParametrePatient,
  listSalleAttente,
  getSalleAttenteNavCount,
} from '@/app/actions/parametres-patient'

export function useVisitesEligiblesParametres(params?: {
  q?: string
  onlyMissing?: boolean
  page?: number
  pageSize?: number
  periode?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: ['medical', 'parametres', 'list', params ?? {}],
    queryFn: () => listVisitesEligiblesParametres(params),
  })
}

export function useParametrePatientByVisite(visiteId: string | undefined) {
  return useQuery({
    queryKey: ['medical', 'parametres', 'detail', visiteId],
    queryFn: () => (visiteId ? getParametrePatientByVisiteId(visiteId) : null),
    enabled: !!visiteId,
  })
}

export function useSalleAttente() {
  return useQuery({
    queryKey: ['medical', 'salle-attente'],
    queryFn: () => listSalleAttente(),
    refetchInterval: 30_000,
  })
}

export function useSalleAttenteNavCount(enabled = true) {
  return useQuery({
    queryKey: ['medical', 'salle-attente', 'nav-count'],
    queryFn: getSalleAttenteNavCount,
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useParametrePatientMutations() {
  const qc = useQueryClient()
  return {
    upsert: useMutation({
      mutationFn: upsertParametrePatient,
      onSuccess: (_data, vars) => {
        void qc.invalidateQueries({ queryKey: ['medical', 'parametres'] })
        void qc.invalidateQueries({ queryKey: ['medical', 'salle-attente'] })
        void qc.invalidateQueries({ queryKey: ['visites'] })
        const visiteId =
          vars && typeof vars === 'object' && 'visiteId' in vars
            ? String((vars as { visiteId: string }).visiteId)
            : undefined
        if (visiteId) {
          void qc.invalidateQueries({
            queryKey: ['medical', 'parametres', 'detail', visiteId],
          })
        }
      },
    }),
  }
}
