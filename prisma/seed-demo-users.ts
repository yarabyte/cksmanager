import { hash } from 'bcrypt'
import type { PrismaClient } from '@prisma/client'

/** Comptes de démonstration alignés sur la page de login (mot de passe : password). */
const DEMO_USERS = [
  {
    id: 9001n,
    email: 'admin@cks.cm',
    name: 'Administrateur Démo',
    role: 'admin',
    titre: 'Monsieur',
    specialite: null as string | null,
  },
  {
    id: 9002n,
    email: 'medecin@cks.cm',
    name: 'Médecin Démo',
    role: 'medecins',
    titre: 'Docteur',
    specialite: 'Généraliste',
  },
  {
    id: 9003n,
    email: 'caisse@cks.cm',
    name: 'Caissier Démo',
    role: 'caisse',
    titre: 'Madame',
    specialite: null as string | null,
  },
  {
    id: 9004n,
    email: 'frontoffice@cks.cm',
    name: 'Accueil Démo',
    role: 'front_office',
    titre: 'Madame',
    specialite: null as string | null,
  },
]

const DEMO_PASSWORD = 'password'

export async function seedDemoUsers(prisma: PrismaClient) {
  const passwordHash = await hash(DEMO_PASSWORD, 10)
  const now = new Date()

  for (const demo of DEMO_USERS) {
    await prisma.user.upsert({
      where: { email: demo.email },
      create: {
        id: demo.id,
        name: demo.name,
        email: demo.email,
        password: passwordHash,
        role: demo.role,
        titre: demo.titre,
        specialite: demo.specialite,
        actif: true,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        name: demo.name,
        password: passwordHash,
        role: demo.role,
        titre: demo.titre,
        specialite: demo.specialite,
        actif: true,
        updatedAt: now,
      },
    })
  }

  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('users', 'id'),
      GREATEST((SELECT MAX(id) FROM users), 1)
    )
  `)

  const poste = await prisma.caissePoste.upsert({
    where: { nom: 'Caisse Accueil' },
    create: {
      nom: 'Caisse Accueil',
      description: "Poste principal à l'accueil",
      actif: true,
    },
    update: {},
  })

  await prisma.user.updateMany({
    where: { email: 'caisse@cks.cm' },
    data: { caissePosteId: poste.id },
  })

  console.log(
    `[seed] Comptes démo créés/mis à jour (${DEMO_USERS.length}) — mot de passe : ${DEMO_PASSWORD}`,
  )
}
