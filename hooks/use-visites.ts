'use client'

import { useQuery } from '@tanstack/react-query'
import { listVisites, listMedecins, listMotifs, getVisiteStats, getVisiteCountsByPatientIds } from '@/app/actions/visites'

export function useVisiteNavCount() {
  return useQuery({
    queryKey: ['visites', 'nav-stats'],
    queryFn: getVisiteStats,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function usePatientsVisiteCounts(patientIds: string[]) {
  const key = [...patientIds].sort().join(',')
  return useQuery({
    queryKey: ['visites', 'counts-by-patient', key],
    queryFn: () => getVisiteCountsByPatientIds(patientIds),
    enabled: patientIds.length > 0,
    staleTime: 30_000,
  })
}

export function usePatientVisites(patientId: string | undefined) {
  return useQuery({
    queryKey: ['visites', 'patient', patientId],
    queryFn: () => listVisites({ patientId: patientId! }),
    enabled: !!patientId && /^\d+$/.test(patientId),
  })
}

export function useVisiteFormOptions(enabled = true) {
  return useQuery({
    queryKey: ['visites', 'form-options'],
    queryFn: async () => {
      const [medecins, motifs] = await Promise.all([listMedecins(), listMotifs()])
      return { medecins, motifs }
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
