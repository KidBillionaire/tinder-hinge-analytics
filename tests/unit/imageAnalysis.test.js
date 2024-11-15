import { jest } from '@jest/globals';
import ProfileImageAnalyzer from '../../public/js/imageAnalysis.js';

describe('ProfileImageAnalyzer', () => {
    let analyzer;
    let mockWorker;

    beforeEach(() => {
        mockWorker = {
            recognize: jest.fn()
        };
        analyzer = new ProfileImageAnalyzer();
        analyzer.worker = mockWorker;
    });

    describe('analyzeImage', () => {
        const mockImageFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
        
        it('should successfully analyze an image and return structured data', async () => {
            // Mock OCR response
            mockWorker.recognize.mockResolvedValue({
                data: {
                    text: 'John, 28\nSoftware Engineer at Google\nLoves hiking and photography'
                }
            });

            const result = await analyzer.analyzeImage(mockImageFile);

            expect(result).toHaveProperty('raw');
            expect(result).toHaveProperty('structured');
            expect(result.structured.profile_data.basic_info.name).toBe('John');
            expect(result.structured.profile_data.basic_info.age).toBe(28);
        });

        it('should handle OCR errors gracefully', async () => {
            mockWorker.recognize.mockRejectedValue(new Error('OCR failed'));

            await expect(analyzer.analyzeImage(mockImageFile)).rejects.toThrow('OCR failed');
        });
    });

    describe('parseProfileText', () => {
        it('should extract basic information correctly', () => {
            const text = 'Sarah, 25\nProduct Designer at Apple\nStudied at Stanford University';
            const result = analyzer.parseProfileText(text);

            expect(result.name).toBe('Sarah');
            expect(result.age).toBe(25);
            expect(result.occupation).toBe('Product Designer at Apple');
            expect(result.school).toBe('Stanford University');
        });

        it('should handle missing information gracefully', () => {
            const text = 'Just looking for friends';
            const result = analyzer.parseProfileText(text);

            expect(result.name).toBeNull();
            expect(result.age).toBeNull();
            expect(result.occupation).toBeNull();
            expect(result.school).toBeNull();
        });
    });
}); 