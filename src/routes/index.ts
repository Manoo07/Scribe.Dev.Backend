import { Route } from '@customTypes/route';
import { authMiddleware } from '@middleware/authMiddleware';
import { allowRoles } from './../middleware/roleMiddleware';

import { authRouter } from '@routes/authRoutes';
import { collegeRouter } from '@routes/collegeRoutes';
import { departmentRouter } from '@routes/departmentRoutes';
import { sectionRouter } from '@routes/sectionRoutes';
import { userRouter } from '@routes/userRoutes';
import classAttendanceRouter from './classAttendanceRoutes';
import { educationalContentRouter } from './educationalContentRoutes';
import { unitRouter } from './unitRoutes';
import { virtualClassroomRouter } from './virtualClassroomRoutes';
import { yearRouter } from './yearRoutes';
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
    basePath: '/educational-content',
    router: educationalContentRouter,
    middleware: [authMiddleware, allowRoles(['ADMIN', 'FACULTY', 'STUDENT'])],
  },
  {
    basePath: '/class-attendance',
    router: classAttendanceRouter,
    middleware: [authMiddleware, allowRoles(['FACULTY'])],
  },
];
