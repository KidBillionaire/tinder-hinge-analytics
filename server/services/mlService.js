import axios from 'axios';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { createHash } from 'crypto';

class MLService {
    constructor() {
        this.baseUrl = process.env.ML_MODEL_ENDPOINT;
        this.apiKey = process.env.ML_API_KEY;
        this.jwtSecret = process.env.JWT_SECRET;
        
        // Initialize axios instance with default config
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 30000, // 30 second timeout
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey
            }
        });

        // Set up request interceptor for authentication
        this.client.interceptors.request.use(
            this.authInterceptor.bind(this),
            this.handleError.bind(this)
        );
    }

    // Rate limiting middleware
    static getRateLimiter() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // Limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP, please try again later.',
            standardHeaders: true,
            legacyHeaders: false
        });
    }

    // Authentication interceptor
    async authInterceptor(config) {
        const timestamp = Date.now();
        const requestId = createHash('sha256')
            .update(`${timestamp}${this.apiKey}`)
            .digest('hex');

        const token = jwt.sign({
            requestId,
            timestamp
        }, this.jwtSecret, { expiresIn: '1m' });

        config.headers.Authorization = `Bearer ${token}`;
        config.headers['X-Request-ID'] = requestId;
        return config;
    }

    // Error handler
    handleError(error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('ML Service Error Response:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });
            throw new Error(`ML Service Error: ${error.response.status}`);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('ML Service No Response:', error.request);
            throw new Error('ML Service Timeout');
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('ML Service Setup Error:', error.message);
            throw new Error('ML Service Configuration Error');
        }
    }

    // Method to generate opener suggestions
    async generateOpener(profileData) {
        try {
            const response = await this.client.post('/generate-opener', {
                profile: profileData,
                timestamp: Date.now()
            });

            return {
                opener: response.data.opener,
                confidence: response.data.confidence,
                modelMetadata: {
                    version: response.data.model_version,
                    latency: response.data.processing_time
                }
            };
        } catch (error) {
            console.error('Generate Opener Error:', error);
            throw error;
        }
    }

    // Method to validate ML model response
    validateResponse(response) {
        const requiredFields = ['opener', 'confidence', 'model_version'];
        const missingFields = requiredFields.filter(field => 
            !response.data.hasOwnProperty(field)
        );

        if (missingFields.length > 0) {
            throw new Error(`Invalid ML response: Missing fields ${missingFields.join(', ')}`);
        }

        if (typeof response.data.confidence !== 'number' || 
            response.data.confidence < 0 || 
            response.data.confidence > 1) {
            throw new Error('Invalid confidence score in ML response');
        }

        return true;
    }

    // Health check method
    async checkHealth() {
        try {
            const response = await this.client.get('/health');
            return {
                status: 'healthy',
                version: response.data.version,
                latency: response.data.latency
            };
        } catch (error) {
            console.error('Health Check Error:', error);
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }
}

export default new MLService(); 