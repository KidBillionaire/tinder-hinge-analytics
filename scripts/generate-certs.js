import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const certsDir = path.join(process.cwd(), 'certs');

// Create certs directory if it doesn't exist
if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir);
}

// Generate self-signed certificate using OpenSSL
const command = `openssl req -x509 -newkey rsa:4096 -keyout ${path.join(certsDir, 'localhost-key.pem')} \
    -out ${path.join(certsDir, 'localhost.pem')} -days 365 -nodes \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=Development/CN=localhost"`;

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error('Error generating certificates:', error);
        return;
    }
    console.log('Development certificates generated successfully!');
    console.log('Location:', certsDir);
}); 