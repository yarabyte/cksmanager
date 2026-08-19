import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/** Kits gynéco-obstétriques (POLYMYOMECTOMIE, CÉSARIENNE, HYSTÉRO, APD, ACCOUCHEMENT, etc.) */
const GYN_KIT_IDS = [16n, 17n, 18n, 19n, 20n, 21n, 22n, 23n]

const NAME_PATTERNS = [
  'speculum',
  'vaginal',
  'oxytoc',
  'misoprost',
  'gyneas',
  'hystero',
  'accouche',
  'césarien',
  'cesarien',
  'myomect',
  'grossesse',
  'obstét',
  'obstet',
  'gynéco',
  'gyneco',
  'gynec',
  'périnée',
  'perinee',
  'col utér',
  'col uter',
  'stérilet',
  'sterilet',
  'mifeprist',
]

async function main() {
  const kitLines = await prisma.kitActeLigne.findMany({
    where: {
      kitActeId: { in: GYN_KIT_IDS },
      typeLigne: 'PHARMA',
      produitId: { not: null },
    },
    select: { produitId: true },
  })
  const kitProductIds = [...new Set(kitLines.map((l) => l.produitId!))]

  const nameMatches = await prisma.produit.findMany({
    where: {
      OR: NAME_PATTERNS.flatMap((p) => [
        { nom: { contains: p, mode: 'insensitive' as const } },
        { principeActif: { contains: p, mode: 'insensitive' as const } },
      ]),
    },
    select: { id: true },
  })

  const allIds = [...new Set([...kitProductIds, ...nameMatches.map((p) => p.id)])]

  const before = await prisma.produit.findMany({
    where: { id: { in: allIds } },
    select: { id: true, nom: true, sitePharma: true },
    orderBy: { nom: 'asc' },
  })

  const toUpdate = before.filter((p) => p.sitePharma !== 'PLENITUDE')
  if (toUpdate.length === 0) {
    console.log(`Aucune mise à jour : ${before.length} produit(s) gynéco déjà en Plénitude.`)
    return
  }

  const result = await prisma.produit.updateMany({
    where: {
      id: { in: toUpdate.map((p) => p.id) },
      sitePharma: { not: 'PLENITUDE' },
    },
    data: { sitePharma: 'PLENITUDE' },
  })

  console.log(`Produits gynéco identifiés : ${before.length}`)
  console.log(`  — via kits gynéco (16–23) : ${kitProductIds.length}`)
  console.log(`  — via nom / principe actif : ${nameMatches.length}`)
  console.log(`Mis à jour en Plénitude : ${result.count}`)
  console.log('---')
  for (const p of toUpdate) {
    console.log(`  #${p.id}  ${p.nom}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
