import { PrismaClient } from '@prisma/client';

class PrismaClientSingleton {
  private static instance: PrismaClient | null = null;
  private static isShuttingDown = false;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        errorFormat: 'pretty',
        // Connection pool configuration for better scaling
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });

      // Graceful shutdown handling
      PrismaClientSingleton.setupGracefulShutdown();
    }

    return PrismaClientSingleton.instance;
  }

  private static setupGracefulShutdown(): void {
    if (!PrismaClientSingleton.instance) return;

    const gracefulShutdown = async (signal: string) => {
      if (PrismaClientSingleton.isShuttingDown) return;

      PrismaClientSingleton.isShuttingDown = true;
      console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

      try {
        // Close Prisma client connection
        await PrismaClientSingleton.instance?.$disconnect();
        console.log('Prisma client disconnected successfully');

        process.exit(0);
      } catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    // Handle different shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon restart

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('Uncaught Exception:', error);
      await gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      await gracefulShutdown('unhandledRejection');
    });
  }

  public static async disconnect(): Promise<void> {
    if (PrismaClientSingleton.instance) {
      await PrismaClientSingleton.instance.$disconnect();
      PrismaClientSingleton.instance = null;
    }
  }

  public static async connect(): Promise<void> {
    if (PrismaClientSingleton.instance) {
      await PrismaClientSingleton.instance.$connect();
    }
  }

  // Method to get connection status
  public static isConnected(): boolean {
    return PrismaClientSingleton.instance !== null;
  }
}

// Export the singleton instance
const prisma = PrismaClientSingleton.getInstance();

// Export the class for testing purposes
export { PrismaClientSingleton };

export default prisma;
