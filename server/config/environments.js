export const environments = {
    development: {
        name: 'development',
        port: 3000,
        httpsPort: 3443,
        apiUrl: 'http://localhost:3000',
        mlEndpoint: process.env.ML_MODEL_ENDPOINT_DEV,
        corsOrigin: 'https://localhost:3000'
    },
    staging: {
        name: 'staging',
        port: 4000,
        httpsPort: 4443,
        apiUrl: 'https://staging.yourdomain.com',
        mlEndpoint: process.env.ML_MODEL_ENDPOINT_STAGING,
        corsOrigin: 'https://staging.yourdomain.com'
    },
    production: {
        name: 'production',
        port: 80,
        httpsPort: 443,
        apiUrl: 'https://api.yourdomain.com',
        mlEndpoint: process.env.ML_MODEL_ENDPOINT_PROD,
        corsOrigin: 'https://yourdomain.com'
    }
};

export function getConfig() {
    const env = process.env.NODE_ENV || 'development';
    return environments[env];
} 