import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error-handler';

import authRoutes from './routes/auth.routes';
import { requestLogger } from './middleware/logger.middleware';
import facilitiesRoutes from './routes/facilities.routes';
import bookingsRoutes from './routes/bookings.routes';
import usersRoutes from './routes/users.routes';
import logger from '../utils/logger';

dotenv.config();

const app: Express = express();
const PORT = process.env.REST_PORT || 3001;

app.use(helmet());

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'aps-rest-api',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        code: 'NOT_FOUND'
    });
});

app.use(errorHandler);

if (require.main === module) {
    app.listen(PORT, () => {
        logger.info(`🚀 REST API running on http://localhost:${PORT}`);
        logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    });
}

export default app;