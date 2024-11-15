import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';

const execAsync = promisify(exec);

async function deployToAWS(environment = 'staging') {
    try {
        console.log(`Starting AWS deployment to ${environment}...`);

        // Validate environment
        if (!['staging', 'production'].includes(environment)) {
            throw new Error('Invalid environment specified');
        }

        // Run tests
        if (environment === 'production') {
            console.log('Running tests...');
            await execAsync('npm run test');
        }

        // Build the application
        console.log('Building application...');
        await execAsync('npm run build');

        // Create deployment package
        console.log('Creating deployment package...');
        const deploymentPath = path.join(process.cwd(), 'dist', 'deploy.zip');
        await createDeploymentPackage(deploymentPath, environment);

        // Deploy to AWS
        console.log(`Deploying to AWS ${environment}...`);
        await execAsync(`eb deploy dating-assistant-${environment} --staged`);

        // Verify deployment
        console.log('Verifying deployment...');
        await verifyDeployment(environment);

        console.log(`Deployment to ${environment} completed successfully!`);
    } catch (error) {
        console.error('Deployment failed:', error);
        process.exit(1);
    }
}

async function createDeploymentPackage(outputPath, environment) {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });

    archive.pipe(output);

    // Add application files
    archive.directory('dist/', false);
    archive.directory('server/', 'server');
    archive.directory('public/', 'public');

    // Add configuration files
    archive.file('package.json', { name: 'package.json' });
    archive.file('package-lock.json', { name: 'package-lock.json' });
    archive.file(`config/${environment}.json`, { name: 'config.json' });
    archive.file('ecosystem.config.js', { name: 'ecosystem.config.js' });

    await archive.finalize();
}

async function verifyDeployment(environment) {
    const maxAttempts = 10;
    const delay = 30000; // 30 seconds

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const domain = environment === 'production' 
                ? 'api.yourdomain.com'
                : 'staging-api.yourdomain.com';

            const response = await fetch(`https://${domain}/health`);
            const data = await response.json();

            if (data.status === 'healthy') {
                console.log('Deployment verified successfully');
                return;
            }

            console.log(`Verification attempt ${attempt}/${maxAttempts} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        } catch (error) {
            if (attempt === maxAttempts) {
                throw new Error('Deployment verification failed');
            }
            console.log(`Verification attempt ${attempt}/${maxAttempts} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Run deployment
const environment = process.argv[2] || 'staging';
deployToAWS(environment); 