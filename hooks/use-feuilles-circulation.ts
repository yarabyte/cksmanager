'use client'

import { useQuery } from '@tanstack/react-query'
import { listFeuilles } from '@/app/actions/feuilles-circulation'

export function usePatientFeuilles(patientId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['feuilles-circulation', 'patient', patientId],
    queryFn: () => listFeuilles({ patientId: patientId! }),
    enabled: !!patientId && /^\d+$/.test(patientId) && enabled,
  })
}
