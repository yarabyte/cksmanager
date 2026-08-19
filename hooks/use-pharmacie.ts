'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPharmacieStats,
  listConditionnements,
  getConditionnementById,
  createConditionnement,
  updateConditionnement,
  deleteConditionnement,
  listFormesGaleniques,
  getFormeGaleniqueById,
  createFormeGalenique,
  updateFormeGalenique,
  deleteFormeGalenique,
  listFournisseurs,
  getFournisseurById,
  createFournisseur,
  updateFournisseur,
  deleteFournisseur,
  listProduits,
  getProduitById,
  createProduit,
  updateProduit,
  deleteProduit,
  updateProduitSitePharma,
} from '@/app/actions/pharmacie'

export function usePharmacieStats() {
  return useQuery({
    queryKey: ['pharmacie', 'stats'],
    queryFn: () => getPharmacieStats(),
  })
}

export function useConditionnementsList(q?: string) {
  return useQuery({
    queryKey: ['pharmacie', 'conditionnements', 'list', q ?? ''],
    queryFn: () => listConditionnements({ q }),
  })
}

export function useConditionnement(id: string | undefined) {
  return useQuery({
    queryKey: ['pharmacie', 'conditionnements', 'detail', id],
    queryFn: () => (id ? getConditionnementById(id) : null),
    enabled: !!id,
  })
}

export function useFormesGaleniquesList(q?: string) {
  return useQuery({
    queryKey: ['pharmacie', 'formes', 'list', q ?? ''],
    queryFn: () => listFormesGaleniques({ q }),
  })
}

export function useFormeGalenique(id: string | undefined) {
  return useQuery({
    queryKey: ['pharmacie', 'formes', 'detail', id],
    queryFn: () => (id ? getFormeGaleniqueById(id) : null),
    enabled: !!id,
  })
}

export function useFournisseursList(q?: string) {
  return useQuery({
    queryKey: ['pharmacie', 'fournisseurs', 'list', q ?? ''],
    queryFn: () => listFournisseurs({ q }),
  })
}

export function useFournisseur(id: string | undefined) {
  return useQuery({
    queryKey: ['pharmacie', 'fournisseurs', 'detail', id],
    queryFn: () => (id ? getFournisseurById(id) : null),
    enabled: !!id,
  })
}

export type ProduitsListParams = {
  q?: string
  formeId?: string
  condId?: string
  assureurId?: string
  sitePharma?: string
  actif?: string
  skip?: number
  take?: number
}

export function useProduitsList(params: ProduitsListParams) {
  return useQuery({
    queryKey: ['pharmacie', 'produits', 'list', params],
    queryFn: () => listProduits(params),
  })
}

export function useProduit(id: string | undefined) {
  return useQuery({
    queryKey: ['pharmacie', 'produits', 'detail', id],
    queryFn: () => (id ? getProduitById(id) : null),
    enabled: !!id,
  })
}

function usePharmacieInvalidate() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: ['pharmacie'] })
  }
}

export function useConditionnementMutations() {
  const inv = usePharmacieInvalidate()
  return {
    create: useMutation({
      mutationFn: createConditionnement,
      onSuccess: inv,
    }),
    update: useMutation({
      mutationFn: updateConditionnement,
      onSuccess: inv,
    }),
    remove: useMutation({
      mutationFn: deleteConditionnement,
      onSuccess: inv,
    }),
  }
}

export function useFormeGaleniqueMutations() {
  const inv = usePharmacieInvalidate()
  return {
    create: useMutation({
      mutationFn: createFormeGalenique,
      onSuccess: inv,
    }),
    update: useMutation({
      mutationFn: updateFormeGalenique,
      onSuccess: inv,
    }),
    remove: useMutation({
      mutationFn: deleteFormeGalenique,
      onSuccess: inv,
    }),
  }
}

export function useFournisseurMutations() {
  const inv = usePharmacieInvalidate()
  return {
    create: useMutation({
      mutationFn: createFournisseur,
      onSuccess: inv,
    }),
    update: useMutation({
      mutationFn: updateFournisseur,
      onSuccess: inv,
    }),
    remove: useMutation({
      mutationFn: deleteFournisseur,
      onSuccess: inv,
    }),
  }
}

export function useProduitMutations() {
  const inv = usePharmacieInvalidate()
  return {
    create: useMutation({
      mutationFn: createProduit,
      onSuccess: inv,
    }),
    update: useMutation({
      mutationFn: updateProduit,
      onSuccess: inv,
    }),
    updateSitePharma: useMutation({
      mutationFn: updateProduitSitePharma,
      onSuccess: inv,
    }),
    remove: useMutation({
      mutationFn: deleteProduit,
      onSuccess: inv,
    }),
  }
}
