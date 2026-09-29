'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientSelect2Suggestions,
} from '@/app/actions/patients'

export function usePatientsList(
  q: string,
  skip = 0,
  take = 50,
  sexe?: number,
  assuranceId?: string,
) {
  return useQuery({
    queryKey: ['patients', 'list', q, skip, take, sexe, assuranceId],
    queryFn: () =>
      listPatients({
        q,
        skip,
        take,
        sexe,
        assuranceId,
      }),
  })
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: ['patients', 'detail', id],
    queryFn: () => (id ? getPatientById(id) : null),
    enabled: !!id,
  })
}

/** Libellés déjà présents en base (`patients`) pour les Select2 lieu / adresse / profession. */
export function usePatientSelect2Suggestions() {
  return useQuery({
    queryKey: ['patients', 'select2-suggestions'],
    queryFn: getPatientSelect2Suggestions,
    staleTime: 60_000,
  })
}

export function usePatientMutations() {
  const qc = useQueryClient()
  const invalidatePatientQueries = () => {
    void qc.invalidateQueries({ queryKey: ['patients', 'list'] })
    void qc.invalidateQueries({ queryKey: ['patients', 'detail'] })
    void qc.invalidateQueries({ queryKey: ['patients', 'select2-suggestions'] })
  }

  const create = useMutation({
    mutationFn: async (data: unknown) => {
      const res = await createPatient(data)
      if (!res.ok) throw new Error(res.error)
      return res.patient
    },
    onSuccess: invalidatePatientQueries,
  })
  const update = useMutation({
    mutationFn: updatePatient,
    onSuccess: invalidatePatientQueries,
  })
  const remove = useMutation({
    mutationFn: deletePatient,
    onSuccess: invalidatePatientQueries,
  })
  return { create, update, remove }
}
