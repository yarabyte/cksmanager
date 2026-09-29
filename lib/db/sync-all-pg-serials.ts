import type { PrismaClient } from '@prisma/client'

/**
 * Réaligne toutes les séquences PostgreSQL `id` (import / dump avec ids explicites).
 * Tables sans séquence (pas de BIGSERIAL) sont ignorées.
 */
export async function syncAllPgSerials(db: Pick<PrismaClient, '$executeRawUnsafe'>): Promise<void> {
  await db.$executeRawUnsafe(`
DO $sync$
DECLARE
  r RECORD;
  seq text;
  max_id bigint;
BEGIN
  FOR r IN
    SELECT c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid
      AND a.attname = 'id'
      AND NOT a.attisdropped
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
  LOOP
    seq := pg_get_serial_sequence(format('%I.%I', 'public', r.tbl), 'id');
    IF seq IS NULL AND EXISTS (
      SELECT 1
      FROM pg_class s
      JOIN pg_namespace ns ON ns.oid = s.relnamespace
      WHERE s.relkind = 'S'
        AND ns.nspname = 'public'
        AND s.relname = r.tbl || '_id_seq'
    ) THEN
      seq := format('%I.%I', 'public', r.tbl || '_id_seq');
    END IF;
    IF seq IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I', 'id', r.tbl) INTO max_id;
    IF max_id <= 0 THEN
      PERFORM setval(seq::regclass, 1, false);
    ELSE
      PERFORM setval(seq::regclass, max_id, true);
    END IF;
  END LOOP;
END
$sync$;
`)
}
