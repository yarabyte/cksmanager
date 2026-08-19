'use client'

import { useQuery } from '@tanstack/react-query'
import { getPatientWallet } from '@/app/actions/wallets'

export function usePatientWallet(patientId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['wallet', 'patient', patientId],
    queryFn: () => (patientId ? getPatientWallet(patientId) : null),
    enabled: !!patientId && /^\d+$/.test(patientId) && enabled,
  })
}
