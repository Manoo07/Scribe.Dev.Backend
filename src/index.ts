import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import session from 'express-session';
import { BASE_URL, HTTP_STATUS_INTERNAL_SERVER_ERROR, HTTP_STATUS_UNAUTHORIZED } from '@constants/constants';
import { logger } from '@services/logService';
import { routers } from '@routes/index';
import './auth/google';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: '*', credentials: true }));

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: true,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

app.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  }),
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failure' }),
  (req: any, res: express.Response) => {
    const { token, user } = req.user;
    const redirectUrl = `${process.env.UI_BASE_URL}/dashboard/overview?token=${token}&name=${encodeURIComponent(user.name)}`;
    res.redirect(redirectUrl);
  },
);

app.get('/auth/failure', (_req, res) => {
  res.status(HTTP_STATUS_UNAUTHORIZED).send('Google Authentication Failed');
});

routers.forEach(({ basePath, router, middleware = [] }) => {
  app.use(`${BASE_URL}${basePath}`, ...middleware, router);
});

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
