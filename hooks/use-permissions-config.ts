'use client'

import { useQuery } from '@tanstack/react-query'
import { getPermissionsConfig } from '@/app/actions/permissions'

export function usePermissionsConfig() {
  return useQuery({
    queryKey: ['permissions', 'config'],
    queryFn: () => getPermissionsConfig(),
  })
}
