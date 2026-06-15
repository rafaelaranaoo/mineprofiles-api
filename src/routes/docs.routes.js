import { Router } from 'express';
import { openApiDocument } from '../docs/openapi.js';

export const openApiRouter = Router();

openApiRouter.get('/openapi.json', (_req, res) => {
  res.json(openApiDocument);
});
