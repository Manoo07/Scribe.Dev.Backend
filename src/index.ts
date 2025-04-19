import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import collegeRoutes from './routes/collegeRoutes';
import departmentRoutes from './routes/departmentRoutes';
import sectionRoutes from './routes/sectionRoutes';
import yearRoutes from './routes/yearRoute';
import { BASE_URL, HTTP_STATUS_INTERNAL_SERVER_ERROR } from './constants/constants';
import { logger } from './services/logService';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use(`${BASE_URL}/auth`, authRoutes);
app.use(`${BASE_URL}/college`, collegeRoutes);
app.use(`${BASE_URL}/department`, departmentRoutes);
app.use(`${BASE_URL}/section`, sectionRoutes);
app.use(`${BASE_URL}/year`, yearRoutes);

// Global error handler middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });
  res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
    message: 'Something went wrong!',
    error: err.message,
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
