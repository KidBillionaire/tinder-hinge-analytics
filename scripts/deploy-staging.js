import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function deployStagingEnvironment() {
    try {
        console.log('Starting staging deployment...');

        // Validate environment variables
        const requiredEnvVars = [
            'ML_MODEL_ENDPOINT_STAGING',
            'DB_HOST_STAGING',
            'REDIS_HOST_STAGING',
            'SSL_KEY_PATH_STAGING',
            'SSL_CERT_PATH_STAGING'
        ];

        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`Missing required environment variable: ${envVar}`);
            }
        }

        // Create staging directory structure
        const stagingDir = path.join(process.cwd(), 'staging');
        await fs.mkdir(stagingDir, { recursive: true });

        // Run tests
        console.log('Running tests...');
        await execAsync('npm run test');

        // Build the application
        console.log('Building application...');
        await execAsync('npm run build');

        // Copy files to staging directory
        console.log('Copying files to staging...');
        await execAsync(`cp -r dist/* ${stagingDir}/`);
        await execAsync(`cp package.json ${stagingDir}/`);
        await execAsync(`cp .env.staging ${stagingDir}/.env`);

        // Install production dependencies
        console.log('Installing dependencies...');
        await execAsync('npm ci --production', { cwd: stagingDir });

        // Start the staging server
        console.log('Starting staging server...');
        await execAsync('NODE_ENV=staging pm2 start ecosystem.config.js --only staging', {
            cwd: stagingDir
        });

        console.log('Staging deployment completed successfully!');
    } catch (error) {
        console.error('Deployment failed:', error);
        process.exit(1);
    }
}

deployStagingEnvironment(); 