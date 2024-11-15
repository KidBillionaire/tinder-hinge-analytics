import { jest } from '@jest/globals';
import MLService from '../../server/services/mlService.js';

describe('MLService', () => {
    let mlService;
    let mockAxios;

    beforeEach(() => {
        mockAxios = {
            post: jest.fn(),
            get: jest.fn()
        };
        mlService = new MLService();
        mlService.client = mockAxios;
    });

    describe('generateOpener', () => {
        const mockProfileData = {
            profile_data: {
                basic_info: {
                    name: 'Emma',
                    age: 24
                }
            }
        };

        it('should successfully generate an opener', async () => {
            mockAxios.post.mockResolvedValue({
                data: {
                    opener: "Hey Emma! I noticed you're into photography...",
                    confidence: 0.85,
                    model_version: '1.0',
                    processing_time: 0.5
                }
            });

            const result = await mlService.generateOpener(mockProfileData);

            expect(result).toHaveProperty('opener');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('modelMetadata');
        });

        it('should handle API errors gracefully', async () => {
            mockAxios.post.mockRejectedValue(new Error('API Error'));

            await expect(mlService.generateOpener(mockProfileData))
                .rejects.toThrow('API Error');
        });
    });

    describe('validateResponse', () => {
        it('should validate complete responses', () => {
            const validResponse = {
                data: {
                    opener: 'Hello!',
                    confidence: 0.9,
                    model_version: '1.0'
                }
            };

            expect(() => mlService.validateResponse(validResponse)).not.toThrow();
        });

        it('should reject invalid responses', () => {
            const invalidResponse = {
                data: {
                    opener: 'Hello!'
                    // Missing required fields
                }
            };

            expect(() => mlService.validateResponse(invalidResponse)).toThrow();
        });
    });
}); 