'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getParametres, updateParametres } from '@/app/actions/parametres'

export function useParametres() {
  return useQuery({
    queryKey: ['parametres'],
    queryFn: () => getParametres(),
  })
}

export function useParametresMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateParametres,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['parametres'] })
    },
  })
}
