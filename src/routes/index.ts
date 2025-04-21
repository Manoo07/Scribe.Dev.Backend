import { Route } from '@customTypes/route';

import { authRouter } from '@routes/authRoutes';
import { collegeRouter } from '@routes/collegeRoutes';
import { departmentRouter } from '@routes/departmentRoutes';
import { yearRouter } from '@routes/yearRoute';
import { sectionRouter } from '@routes/sectionRoutes';
import { userRouter } from '@routes/userRoutes';

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
  },
];
