import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from '@utils/logger';
import { errorHandler } from './middleware/error-handler';

// Routes
import authRoutes from './routes/auth.routes';
import { requestLogger } from './middleware/logger.middleware';
import facilitiesRoutes from './routes/facilities.routes';
import bookingsRoutes from './routes/bookings.routes';
import usersRoutes from './routes/users.routes';

dotenv.config();

const app: Express = express();
const PORT = process.env.REST_PORT || 3001;

// ============================================
// MIDDLEWARE
// ===========================================

// Security headers
app.use(helmet());

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'aps-rest-api',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/users', usersRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        code: 'NOT_FOUND'
    });
});

// Error handler (must be last)
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

if (require.main === module) {
    app.listen(PORT, () => {
        logger.info(`🚀 REST API running on http://localhost:${PORT}`);
        logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    });
}

export default app;