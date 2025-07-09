import { PrismaClient } from '@prisma/client';

// Create a single instance of Prisma Client
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Initialize Prisma connection
export const initializePrisma = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to Prisma:', error);
    throw error;
  }
};

// Disconnect Prisma
export const disconnectPrisma = async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ Prisma disconnected successfully');
  } catch (error) {
    console.error('❌ Failed to disconnect Prisma:', error);
  }
};

// Health check
export const checkPrismaHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true };
  } catch (error) {
    console.error('❌ Prisma health check failed:', error);
    return { healthy: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Transaction helper
export const withTransaction = async <T>(
  callback: (tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> => {
  return await prisma.$transaction(callback);
};

// Graceful shutdown
export const gracefulShutdown = async () => {
  console.log('🔄 Shutting down Prisma...');
  await disconnectPrisma();
};

// Handle process termination
process.on('beforeExit', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

