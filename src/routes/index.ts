import { allowRoles } from './../middleware/roleMiddleware';
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
    middleware: [],
  },
  {
    basePath: '/college',
    router: collegeRouter,
    middleware: [authMiddleware, allowRoles(['ADMIN', 'FACULTY'])],
  },
  {
    basePath: '/department',
    router: departmentRouter,
    middleware: [authMiddleware, allowRoles(['ADMIN', 'FACULTY'])],
  },
  {
    basePath: '/year',
    router: yearRouter,
    middleware: [authMiddleware, allowRoles(['ADMIN', 'FACULTY'])],
  },
  {
    basePath: '/section',
    router: sectionRouter,
    middleware: [authMiddleware, allowRoles(['ADMIN', 'FACULTY'])],
  },
  {
    basePath: '/user',
    router: userRouter,
    middleware: [authMiddleware, allowRoles(['ADMIN', 'STUDENT', 'FACULTY'])],
  },
  {
    basePath: '/classroom',
    router: virtualClassroomRouter,
    middleware: [authMiddleware, allowRoles(['ADMIN', 'STUDENT', 'FACULTY'])],
  },
];
