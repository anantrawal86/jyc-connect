import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { api } from './routes/api.js';
import { errorHandler, HttpError } from './errors.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', config.NODE_ENV === 'production' ? 1 : false);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.FRONTEND_ORIGIN, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type'] }));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
if (config.STORAGE_DRIVER === 'local' && config.NODE_ENV !== 'production') {
  const root = path.resolve(config.LOCAL_STORAGE_DIR);
  app.use('/uploads', express.static(root, { immutable: true, maxAge: '1y', dotfiles: 'deny', fallthrough: false }));
}
app.use('/api', api);
app.use((req, res, next) => next(new HttpError(404, 'NOT_FOUND', 'Endpoint not found.')));
app.use(errorHandler);
export default app;
