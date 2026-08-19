'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, scriptProps, ...props }: ThemeProviderProps) {
  // React 19 / Next 16 : next-themes injecte un <script> anti-FOUC.
  // En SSR le script doit s'exécuter ; côté client on évite l'avertissement console.
  const resolvedScriptProps =
    typeof window === 'undefined'
      ? scriptProps
      : { ...scriptProps, type: 'application/json' as const }

  return (
    <NextThemesProvider {...props} scriptProps={resolvedScriptProps}>
      {children}
    </NextThemesProvider>
  )
}
