import { Router } from 'express';
import { getConfig } from '../config/environments.js';

const router = Router();
const config = getConfig();

router.get('/health', async (req, res) => {
    try {
        const healthStatus = {
            status: 'healthy',
            environment: config.name,
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version,
            services: {
                database: await checkDatabaseHealth(),
                redis: await checkRedisHealth(),
                mlService: await checkMLServiceHealth()
            }
        };

        const unhealthyServices = Object.entries(healthStatus.services)
            .filter(([_, status]) => status !== 'healthy')
            .map(([service]) => service);

        if (unhealthyServices.length > 0) {
            res.status(503).json({
                ...healthStatus,
                status: 'unhealthy',
                unhealthyServices
            });
        } else {
            res.json(healthStatus);
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

export default router; 