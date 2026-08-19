function jsonRoundTrip(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => {
      if (typeof v === 'bigint') return v.toString()
      if (
        v != null &&
        typeof v === 'object' &&
        'toFixed' in v &&
        typeof (v as { toFixed: (n: number) => string }).toFixed === 'function'
      ) {
        return (v as { toString: () => string }).toString()
      }
      return v
    }),
  )
}

/** Sérialise les BigInt (et Decimal) pour les réponses d’actions serveur / JSON. */
export function toSerializable<T>(value: T): T {
  return jsonRoundTrip(value) as T
}

/**
 * Même sérialisation que {@link toSerializable}, avec typage explicite du résultat
 * (utile quand l’entrée Prisma contient des BigInt et la sortie attendue des strings).
 */
export function toSerializableAs<T>(value: unknown): T {
  return jsonRoundTrip(value) as T
}
