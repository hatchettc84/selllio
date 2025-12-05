import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Force the correct Neon database URL
const DATABASE_URL = "postgresql://neondb_owner:npg_9rKa0dPJINj6@ep-shiny-forest-a50lcam5.us-east-2.aws.neon.tech/neondb?sslmode=require"

console.log('Using DATABASE_URL:', DATABASE_URL.substring(0, 50) + '...')

export const prismaClient = globalThis.prisma || new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
})
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prismaClient
