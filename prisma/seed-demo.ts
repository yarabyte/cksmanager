import { PrismaClient } from '@prisma/client'
import { seedDemoUsers } from './seed-demo-users'

const prisma = new PrismaClient()

async function main() {
  await seedDemoUsers(prisma)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
