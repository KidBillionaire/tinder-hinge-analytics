import ProfileDataTransformer from '../../public/js/dataTransformer.js';

describe('ProfileDataTransformer', () => {
    let transformer;

    beforeEach(() => {
        transformer = new ProfileDataTransformer();
    });

    describe('transformForML', () => {
        it('should transform raw data into ML model format', () => {
            const mockData = {
                textInfo: {
                    name: 'Alice',
                    age: 26,
                    occupation: 'Software Engineer',
                    interests: ['hiking', 'photography', 'travel']
                },
                visualElements: {
                    categories: ['outdoor', 'nature', 'urban']
                }
            };

            const result = transformer.transformForML(mockData);

            expect(result).toHaveProperty('profile_data');
            expect(result).toHaveProperty('visual_features');
            expect(result).toHaveProperty('metadata');
        });
    });

    describe('processInterests', () => {
        it('should categorize interests correctly', () => {
            const interests = ['hiking', 'painting', 'gym', 'reading'];
            const result = transformer.processInterests(interests);

            expect(result.categories).toHaveProperty('outdoor_activities');
            expect(result.categories).toHaveProperty('arts_culture');
            expect(result.categories).toHaveProperty('fitness_sports');
            expect(result.categories).toHaveProperty('intellectual');
        });

        it('should calculate confidence scores for categories', () => {
            const interests = ['hiking', 'camping', 'mountaineering'];
            const result = transformer.processInterests(interests);

            expect(result.categories.outdoor_activities.confidence).toBeGreaterThan(0.8);
        });
    });
}); 