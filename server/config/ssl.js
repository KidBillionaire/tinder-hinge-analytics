import fs from 'fs';
import path from 'path';

const SSL_CONFIG = {
    production: {
        key: process.env.SSL_KEY_PATH || '/etc/letsencrypt/live/yourdomain.com/privkey.pem',
        cert: process.env.SSL_CERT_PATH || '/etc/letsencrypt/live/yourdomain.com/fullchain.pem'
    },
    development: {
        key: path.join(process.cwd(), 'certs', 'localhost-key.pem'),
        cert: path.join(process.cwd(), 'certs', 'localhost.pem')
    }
};

export function getSSLConfig() {
    const env = process.env.NODE_ENV || 'development';
    const config = SSL_CONFIG[env];

    try {
        return {
            key: fs.readFileSync(config.key),
            cert: fs.readFileSync(config.cert),
            minVersion: 'TLSv1.2', // Enforce minimum TLS version
            ciphers: [
                'ECDHE-ECDSA-AES128-GCM-SHA256',
                'ECDHE-RSA-AES128-GCM-SHA256',
                'ECDHE-ECDSA-AES256-GCM-SHA384',
                'ECDHE-RSA-AES256-GCM-SHA384',
                'ECDHE-ECDSA-CHACHA20-POLY1305',
                'ECDHE-RSA-CHACHA20-POLY1305',
                'DHE-RSA-AES128-GCM-SHA256',
                'DHE-RSA-AES256-GCM-SHA384'
            ].join(':'),
            honorCipherOrder: true // Prefer server's cipher suite order
        };
    } catch (error) {
        console.error('SSL Configuration Error:', error);
        throw new Error('Failed to load SSL certificates');
    }
} 