import { PrismaClient } from '@prisma/client'

declare global {
  // Prevent multiple instances in development hot-reload
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined
}

export const prisma =
  global.prismaGlobal ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma
}
