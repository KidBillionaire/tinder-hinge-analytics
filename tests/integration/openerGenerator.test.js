import request from 'supertest';
import app from '../../server/index.js';
import mlService from '../../server/services/mlService.js';

jest.mock('../../server/services/mlService.js');

describe('Opener Generator API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/generate-opener', () => {
        const mockProfileData = {
            profile_data: {
                basic_info: {
                    name: 'Test User',
                    age: 25
                }
            }
        };

        it('should generate an opener successfully', async () => {
            mlService.checkHealth.mockResolvedValue({ status: 'healthy' });
            mlService.generateOpener.mockResolvedValue({
                opener: 'Hello Test User!',
                confidence: 0.9,
                source: 'ml_model'
            });

            const response = await request(app)
                .post('/api/generate-opener')
                .send(mockProfileData)
                .expect(200);

            expect(response.body).toHaveProperty('opener');
            expect(response.body).toHaveProperty('confidence');
            expect(response.body.source).toBe('ml_model');
        });

        it('should fall back to OpenAI when ML service confidence is low', async () => {
            mlService.checkHealth.mockResolvedValue({ status: 'healthy' });
            mlService.generateOpener.mockResolvedValue({
                opener: 'Hello',
                confidence: 0.5
            });

            const response = await request(app)
                .post('/api/generate-opener')
                .send(mockProfileData)
                .expect(200);

            expect(response.body.source).toBe('openai');
        });

        it('should handle ML service errors', async () => {
            mlService.checkHealth.mockResolvedValue({ status: 'unhealthy' });

            const response = await request(app)
                .post('/api/generate-opener')
                .send(mockProfileData)
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });
    });
}); 