'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listVisitesEligiblesAntecedents,
  getAntecedentPatientByVisiteId,
  upsertAntecedentPatient,
} from '@/app/actions/antecedents-patient'

export function useVisitesEligiblesAntecedents(params?: {
  q?: string
  onlyMissing?: boolean
  page?: number
  pageSize?: number
  periode?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: ['medical', 'antecedents', 'list', params ?? {}],
    queryFn: () => listVisitesEligiblesAntecedents(params),
  })
}

export function useAntecedentPatientByVisite(visiteId: string | undefined) {
  return useQuery({
    queryKey: ['medical', 'antecedents', 'detail', visiteId],
    queryFn: () => (visiteId ? getAntecedentPatientByVisiteId(visiteId) : null),
    enabled: !!visiteId,
  })
}

export function useAntecedentPatientMutations() {
  const qc = useQueryClient()
  return {
    upsert: useMutation({
      mutationFn: upsertAntecedentPatient,
      onSuccess: (_data, vars) => {
        void qc.invalidateQueries({ queryKey: ['medical', 'antecedents'] })
        void qc.invalidateQueries({ queryKey: ['visites'] })
        const visiteId =
          vars && typeof vars === 'object' && 'visiteId' in vars
            ? String((vars as { visiteId: string }).visiteId)
            : undefined
        if (visiteId) {
          void qc.invalidateQueries({
            queryKey: ['medical', 'antecedents', 'detail', visiteId],
          })
        }
      },
    }),
  }
}
