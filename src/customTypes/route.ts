import { RequestHandler, Router } from 'express';

export interface Route {
  basePath: string;
  router: Router;
  middleware?: any;
}
