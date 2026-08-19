'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listKitActes,
  getKitActeById,
  createKitActe,
  updateKitActe,
  deleteKitActe,
  createKitActeLigne,
  updateKitActeLigne,
  deleteKitActeLigne,
  listActesForKitSelect,
  listProduitsForKitSelect,
} from '@/app/actions/kits'
import type {
  ActeSelectRow,
  KitActeDetailSerializable,
  KitActeLigneSerializable,
  ProduitSelectRow,
} from '@/lib/types/kits'

export type {
  ActeSelectRow,
  KitActeDetailSerializable,
  KitActeLigneSerializable,
  ProduitSelectRow,
} from '@/lib/types/kits'

export type KitActesListParams = {
  q?: string
  actif?: string
  userId?: string
  skip?: number
  take?: number
}

export function useKitActesList(params: KitActesListParams) {
  return useQuery({
    queryKey: ['kits', 'list', params],
    queryFn: () => listKitActes(params),
  })
}

export function useKitActe(id: string | undefined) {
  return useQuery<KitActeDetailSerializable | null>({
    queryKey: ['kits', 'detail', id],
    queryFn: () => (id ? getKitActeById(id) : null),
    enabled: !!id,
  })
}

export function useActesKitSelect() {
  return useQuery<ActeSelectRow[]>({
    queryKey: ['kits', 'actes-select'],
    queryFn: () => listActesForKitSelect(),
  })
}

export function useProduitsKitSelect(q?: string) {
  return useQuery<ProduitSelectRow[]>({
    queryKey: ['kits', 'produits-select', q ?? ''],
    queryFn: () => listProduitsForKitSelect({ q }),
  })
}

function invalidateKits(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['kits'] })
}

export function useKitActeMutations() {
  const qc = useQueryClient()
  const inv = () => invalidateKits(qc)
  return {
    create: useMutation({ mutationFn: createKitActe, onSuccess: inv }),
    update: useMutation({ mutationFn: updateKitActe, onSuccess: inv }),
    remove: useMutation({ mutationFn: deleteKitActe, onSuccess: inv }),
  }
}

export function useKitActeLigneMutations() {
  const qc = useQueryClient()
  const inv = () => invalidateKits(qc)
  return {
    create: useMutation({ mutationFn: createKitActeLigne, onSuccess: inv }),
    update: useMutation({ mutationFn: updateKitActeLigne, onSuccess: inv }),
    remove: useMutation({ mutationFn: deleteKitActeLigne, onSuccess: inv }),
  }
}
