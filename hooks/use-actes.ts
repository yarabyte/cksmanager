'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listActes,
  getActeById,
  createActe,
  updateActe,
  deleteActe,
} from '@/app/actions/actes'
import {
  listCategorieActes,
  createCategorieActe,
  updateCategorieActe,
  deleteCategorieActe,
} from '@/app/actions/categories'

export function useActesList(filters: {
  q?: string
  categorieId?: string
  assureurId?: string
  typeActe?: string
  skip?: number
  take?: number
}) {
  return useQuery({
    queryKey: ['actes', 'list', filters],
    queryFn: () => listActes(filters),
  })
}

export function useActe(id: string | undefined) {
  return useQuery({
    queryKey: ['actes', 'detail', id],
    queryFn: () => (id ? getActeById(id) : null),
    enabled: !!id,
  })
}

export function useCategoriesList() {
  return useQuery({
    queryKey: ['categorie_actes', 'list'],
    queryFn: () => listCategorieActes(),
  })
}

export function useActeMutations() {
  const qc = useQueryClient()
  const inv = () => {
    void qc.invalidateQueries({ queryKey: ['actes'] })
  }
  return {
    create: useMutation({ mutationFn: createActe, onSuccess: inv }),
    update: useMutation({ mutationFn: updateActe, onSuccess: inv }),
    remove: useMutation({ mutationFn: deleteActe, onSuccess: inv }),
  }
}

export function useCategorieMutations() {
  const qc = useQueryClient()
  const inv = () => {
    void qc.invalidateQueries({ queryKey: ['categorie_actes'] })
    void qc.invalidateQueries({ queryKey: ['actes'] })
  }
  return {
    create: useMutation({ mutationFn: createCategorieActe, onSuccess: inv }),
    update: useMutation({ mutationFn: updateCategorieActe, onSuccess: inv }),
    remove: useMutation({ mutationFn: deleteCategorieActe, onSuccess: inv }),
  }
}
