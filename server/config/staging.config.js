import { environments } from './environments.js';

const stagingConfig = {
    ...environments.staging,
    database: {
        host: process.env.DB_HOST_STAGING,
        user: process.env.DB_USER_STAGING,
        password: process.env.DB_PASSWORD_STAGING,
        database: process.env.DB_NAME_STAGING
    },
    redis: {
        host: process.env.REDIS_HOST_STAGING,
        port: process.env.REDIS_PORT_STAGING,
        password: process.env.REDIS_PASSWORD_STAGING
    },
    logging: {
        level: 'debug',
        format: 'json',
        filename: 'logs/staging.log'
    },
    monitoring: {
        enabled: true,
        sampleRate: 0.5
    },
    security: {
        rateLimitRequests: 200,
        rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
        maxFileSize: '10mb'
    }
};

export default stagingConfig; 