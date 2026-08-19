'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listAssurances,
  getAssuranceById,
  createAssurance,
  updateAssurance,
  deleteAssurance,
  createAssuranceValeur,
  updateAssuranceValeur,
  deleteAssuranceValeur,
} from '@/app/actions/assurances'

export function useAssurancesList() {
  return useQuery({
    queryKey: ['assurances', 'list'],
    queryFn: () => listAssurances(),
  })
}

export function useAssurance(id: string | undefined) {
  return useQuery({
    queryKey: ['assurances', 'detail', id],
    queryFn: () => (id ? getAssuranceById(id) : null),
    enabled: !!id,
  })
}

export function useAssuranceMutations() {
  const qc = useQueryClient()
  const inv = () => {
    void qc.invalidateQueries({ queryKey: ['assurances'] })
  }
  return {
    create: useMutation({ mutationFn: createAssurance, onSuccess: inv }),
    update: useMutation({ mutationFn: updateAssurance, onSuccess: inv }),
    remove: useMutation({ mutationFn: deleteAssurance, onSuccess: inv }),
    createValeur: useMutation({
      mutationFn: createAssuranceValeur,
      onSuccess: inv,
    }),
    updateValeur: useMutation({
      mutationFn: updateAssuranceValeur,
      onSuccess: inv,
    }),
    deleteValeur: useMutation({
      mutationFn: deleteAssuranceValeur,
      onSuccess: inv,
    }),
  }
}
