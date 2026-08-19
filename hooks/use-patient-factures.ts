"use client"

import { useQuery } from "@tanstack/react-query"
import { getFacturesByPatientId } from "@/app/actions/factures"

export function usePatientFactures(patientId: string, enabled = true) {
  return useQuery({
    queryKey: ["factures", "patient", patientId],
    queryFn: () => getFacturesByPatientId(patientId),
    enabled: enabled && !!patientId,
  })
}
