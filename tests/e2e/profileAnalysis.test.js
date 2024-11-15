import fs from 'fs';
import path from 'path';
import request from 'supertest';
import app from '../../server/index.js';
import ProfileImageAnalyzer from '../../public/js/imageAnalysis.js';

describe('End-to-End Profile Analysis', () => {
    let analyzer;
    const sampleImagesDir = path.join(process.cwd(), 'tests', 'fixtures', 'sample_profiles');
    
    beforeAll(async () => {
        analyzer = new ProfileImageAnalyzer();
        await analyzer.initTesseract();
    });

    afterAll(async () => {
        if (analyzer.worker) {
            await analyzer.worker.terminate();
        }
    });

    const testCases = [
        {
            name: 'clear_text_profile',
            expectedData: {
                name: 'Sarah',
                age: 28,
                occupation: 'Software Engineer',
                interests: ['hiking', 'photography', 'travel']
            }
        },
        {
            name: 'multiple_photos_profile',
            expectedData: {
                name: 'Mike',
                age: 32,
                occupation: 'Product Designer',
                interests: ['music', 'surfing', 'cooking']
            }
        },
        {
            name: 'low_quality_image',
            expectedData: {
                name: 'Alex',
                age: 25,
                shouldFallbackToOpenAI: true
            }
        }
    ];

    describe('Image Analysis Pipeline', () => {
        testCases.forEach(({ name, expectedData }) => {
            test(`should correctly analyze ${name}`, async () => {
                const imagePath = path.join(sampleImagesDir, `${name}.jpg`);
                const imageBuffer = fs.readFileSync(imagePath);
                const imageFile = new File([imageBuffer], `${name}.jpg`, { type: 'image/jpeg' });

                // Analyze image
                const analysisResult = await analyzer.analyzeImage(imageFile);

                // Verify basic structure
                expect(analysisResult).toHaveProperty('raw');
                expect(analysisResult).toHaveProperty('structured');

                // Check extracted data
                const { structured } = analysisResult;
                expect(structured.profile_data.basic_info.name).toBe(expectedData.name);
                expect(structured.profile_data.basic_info.age).toBe(expectedData.age);

                if (expectedData.occupation) {
                    expect(structured.profile_data.basic_info.occupation.title)
                        .toBe(expectedData.occupation);
                }

                if (expectedData.interests) {
                    const extractedInterests = structured.profile_data.interests.raw_interests;
                    expectedData.interests.forEach(interest => {
                        expect(extractedInterests).toContain(interest);
                    });
                }

                // Verify confidence scores
                expect(structured.metadata.processing_stats.confidence_metrics.text)
                    .toBeGreaterThan(0);
                expect(structured.metadata.processing_stats.confidence_metrics.visual)
                    .toBeGreaterThan(0);
            });
        });
    });

    describe('Full Pipeline Integration', () => {
        test('should process multiple images and generate openers', async () => {
            const formData = new FormData();
            
            // Add multiple test images
            for (const testCase of testCases) {
                const imagePath = path.join(sampleImagesDir, `${testCase.name}.jpg`);
                const imageBuffer = fs.readFileSync(imagePath);
                formData.append('photos', new Blob([imageBuffer], { type: 'image/jpeg' }), `${testCase.name}.jpg`);
            }

            // Upload and analyze images
            const uploadResponse = await request(app)
                .post('/api/upload-photos')
                .send(formData)
                .expect(200);

            expect(uploadResponse.body).toHaveProperty('results');
            expect(uploadResponse.body.results).toHaveLength(testCases.length);

            // Generate openers for each analyzed profile
            for (const result of uploadResponse.body.results) {
                const openerResponse = await request(app)
                    .post('/api/generate-opener')
                    .send(result.structured)
                    .expect(200);

                expect(openerResponse.body).toHaveProperty('opener');
                expect(openerResponse.body).toHaveProperty('confidence');
                expect(openerResponse.body).toHaveProperty('source');
                
                // Verify opener quality
                expect(openerResponse.body.opener.length).toBeGreaterThan(20);
                expect(openerResponse.body.opener.length).toBeLessThan(200);
                
                // Check for personalization
                if (result.structured.profile_data.basic_info.name) {
                    expect(openerResponse.body.opener).toContain(
                        result.structured.profile_data.basic_info.name
                    );
                }
            }
        });

        test('should handle various error conditions', async () => {
            // Test invalid file type
            const invalidFormData = new FormData();
            invalidFormData.append('photos', new Blob(['invalid'], { type: 'text/plain' }), 'invalid.txt');

            await request(app)
                .post('/api/upload-photos')
                .send(invalidFormData)
                .expect(400);

            // Test missing files
            await request(app)
                .post('/api/upload-photos')
                .send({})
                .expect(400);

            // Test corrupted image
            const corruptedFormData = new FormData();
            corruptedFormData.append('photos', new Blob([Buffer.from('corrupted')], { type: 'image/jpeg' }), 'corrupted.jpg');

            const corruptedResponse = await request(app)
                .post('/api/upload-photos')
                .send(corruptedFormData)
                .expect(200);

            expect(corruptedResponse.body.results[0].error).toBeTruthy();
        });
    });

    describe('Performance Testing', () => {
        test('should handle concurrent requests efficiently', async () => {
            const concurrentRequests = 5;
            const imagePath = path.join(sampleImagesDir, 'clear_text_profile.jpg');
            const imageBuffer = fs.readFileSync(imagePath);

            const requests = Array(concurrentRequests).fill().map(() => {
                const formData = new FormData();
                formData.append('photos', new Blob([imageBuffer], { type: 'image/jpeg' }), 'test.jpg');

                return request(app)
                    .post('/api/upload-photos')
                    .send(formData);
            });

            const startTime = Date.now();
            const responses = await Promise.all(requests);
            const endTime = Date.now();

            // Verify all requests succeeded
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.results).toBeDefined();
            });

            // Check performance
            const totalTime = endTime - startTime;
            const averageTime = totalTime / concurrentRequests;
            expect(averageTime).toBeLessThan(5000); // 5 seconds per request max
        });
    });
}); 