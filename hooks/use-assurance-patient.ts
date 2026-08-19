'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createAssurancePatient,
  updateAssurancePatient,
  deleteAssurancePatient,
  createAssurancePatientCouverture,
  updateAssurancePatientCouverture,
  deleteAssurancePatientCouverture,
} from '@/app/actions/assurance-patient'

export function useAssurancePatientMutations(patientId: string) {
  const qc = useQueryClient()
  const inv = () => {
    void qc.invalidateQueries({ queryKey: ['patients', 'detail', patientId] })
    void qc.invalidateQueries({ queryKey: ['patients'] })
  }
  return {
    createAp: useMutation({
      mutationFn: createAssurancePatient,
      onSuccess: inv,
    }),
    updateAp: useMutation({
      mutationFn: updateAssurancePatient,
      onSuccess: inv,
    }),
    deleteAp: useMutation({
      mutationFn: deleteAssurancePatient,
      onSuccess: inv,
    }),
    createCov: useMutation({
      mutationFn: createAssurancePatientCouverture,
      onSuccess: inv,
    }),
    updateCov: useMutation({
      mutationFn: updateAssurancePatientCouverture,
      onSuccess: inv,
    }),
    deleteCov: useMutation({
      mutationFn: deleteAssurancePatientCouverture,
      onSuccess: inv,
    }),
  }
}
