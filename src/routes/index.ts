import { Route } from '@customTypes/route';
import { authMiddleware } from '@middleware/authMiddleware';

import { authRouter } from '@routes/authRoutes';
import { collegeRouter } from '@routes/collegeRoutes';
import { departmentRouter } from '@routes/departmentRoutes';
import { sectionRouter } from '@routes/sectionRoutes';
import { userRouter } from '@routes/userRoutes';
import { yearRouter } from './yearRoutes';
import { virtualClassroomRouter } from './virtualClassroomRoutes';

export const routers: Route[] = [
  {
    basePath: '/auth',
    router: authRouter,
  },
  {
    basePath: '/college',
    router: collegeRouter,
    middleware: [authMiddleware],
  },
  {
    basePath: '/department',
    router: departmentRouter,
    middleware: [authMiddleware],
  },
  {
    basePath: '/year',
    router: yearRouter,
    middleware: [authMiddleware],
  },
  {
    basePath: '/section',
    router: sectionRouter,
    middleware: [authMiddleware],
  },
  {
    basePath: '/user',
    router: userRouter,
    middleware: [authMiddleware],
  },
  {
    basePath: '/classroom',
    router: virtualClassroomRouter,
    middleware: [authMiddleware],
  },
];
