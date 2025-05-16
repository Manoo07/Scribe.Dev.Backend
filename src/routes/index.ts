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
import { unitRouter } from './unitRoutes';
import { educationalContentRouter } from './educationalContentRoutes';
export const routers: Route[] = [
  {
    basePath: '/auth',
    router: authRouter,
  },
  {
    basePath: '/college',
    router: collegeRouter,
  },
  {
    basePath: '/department',
    router: departmentRouter,
  },
  {
    basePath: '/year',
    router: yearRouter,
  },
  {
    basePath: '/section',
    router: sectionRouter,
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
  {
    basePath: '/unit',
    router: unitRouter,
    middleware: [authMiddleware, allowRoles(['ADMIN', 'FACULTY', 'STUDENT'])],
  },

  {
    basePath: '/educationalContent',
    router: educationalContentRouter,
    middleware: [authMiddleware, allowRoles(['ADMIN', 'STUDENT', 'FACULTY'])],
  }
];
