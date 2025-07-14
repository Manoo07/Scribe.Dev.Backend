import { BASE_URL, HTTP_STATUS_INTERNAL_SERVER_ERROR } from '@constants/constants';
import { routers } from '@routes/index';
import { logger } from '@services/logService';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Define routes
routers.forEach(({ basePath, router, middleware = [] }) => {
  app.use(`${BASE_URL}${basePath}`, ...middleware, router);
});

// Global error handler middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err.status || HTTP_STATUS_INTERNAL_SERVER_ERROR;
  const message = err.message || 'Something went wrong!';
  logger.error(`Error: ${message}`, { stack: err.stack });
  res.status(status).json({
    message,
    error: err.error || message,
  });
});

// shutdown logic
const shutdown = () => {
  logger.info('Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Force shutting down after 10 seconds');
    process.exit(1);
  }, 10000);
};

const server = app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
