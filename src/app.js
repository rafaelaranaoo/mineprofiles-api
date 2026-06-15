import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { env } from './config/env.js';
import { openApiRouter } from './routes/docs.routes.js';
import { playerRouter } from './routes/player.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { notFoundHandler } from './middlewares/notFound.middleware.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

app.get('/', (_req, res) => {
  res.json({
    name: 'MineProfiles API',
    description: 'API REST de perfis Minecraft com MongoDB e Mojang API.',
    docs: '/docs/openapi.json',
    health: '/health'
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'mineprofiles-api'
  });
});

app.use('/docs', openApiRouter);
app.use('/players', playerRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
