import './types';

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from './config/constants';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import path from 'path';
import uploadRoutes from './routes/upload.routes';
import passport from './config/passport';
import './config/passport';

const app: Application = express();
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Health check (before rate limiter so it's always reachable)
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());
app.use(passport.initialize());

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(`/api/${config.apiVersion}`, apiLimiter);

app.use('/api/v1/upload', uploadRoutes);
app.use(`/api/${config.apiVersion}`, routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;