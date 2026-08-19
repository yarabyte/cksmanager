'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserById, updateUser } from '@/app/actions/users'
import type { UserUpdateValues } from '@/lib/validations/user'

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ['users', 'detail', id],
    queryFn: () => (id ? getUserById(id) : null),
    enabled: !!id,
  })
}

export function useUserMutations() {
  const qc = useQueryClient()

  const invalidate = (id?: string) => {
    void qc.invalidateQueries({ queryKey: ['users', 'list'] })
    if (id) void qc.invalidateQueries({ queryKey: ['users', 'detail', id] })
  }

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdateValues }) =>
      updateUser(id, data),
    onSuccess: (_, { id }) => invalidate(id),
  })

  return { update }
}
