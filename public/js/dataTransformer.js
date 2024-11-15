class ProfileDataTransformer {
    constructor() {
        this.confidenceThreshold = 0.7; // Minimum confidence score for extracted data
    }

    transformForML(analysisResults) {
        return {
            profile_data: this.transformProfileData(analysisResults.textInfo),
            visual_features: this.transformVisualFeatures(analysisResults.visualElements),
            metadata: this.generateMetadata(analysisResults)
        };
    }

    transformProfileData(textInfo) {
        return {
            basic_info: {
                name: textInfo.name || null,
                age: textInfo.age || null,
                occupation: {
                    title: textInfo.occupation || null,
                    confidence: this.calculateConfidence(textInfo.occupation)
                },
                education: {
                    school: textInfo.school || null,
                    confidence: this.calculateConfidence(textInfo.school)
                }
            },
            interests: this.processInterests(textInfo.interests),
            bio_analysis: this.analyzeBio(textInfo.bio),
            text_features: this.extractTextFeatures(textInfo)
        };
    }

    transformVisualFeatures(visualElements) {
        return {
            detected_categories: this.processCategories(visualElements),
            activity_signals: this.extractActivitySignals(visualElements),
            lifestyle_indicators: this.processLifestyleIndicators(visualElements),
            image_quality_metrics: this.calculateImageMetrics(visualElements)
        };
    }

    processInterests(interests) {
        const categories = {
            outdoor_activities: ['hiking', 'camping', 'climbing', 'surfing'],
            arts_culture: ['music', 'art', 'theater', 'museum'],
            social_activities: ['travel', 'foodie', 'wine', 'dancing'],
            fitness_sports: ['gym', 'yoga', 'running', 'sports'],
            intellectual: ['reading', 'writing', 'philosophy', 'science']
        };

        const categorizedInterests = {};
        
        for (const [category, keywords] of Object.entries(categories)) {
            const matches = interests.filter(interest =>
                keywords.some(keyword => 
                    interest.toLowerCase().includes(keyword)
                )
            );
            
            if (matches.length > 0) {
                categorizedInterests[category] = {
                    items: matches,
                    confidence: this.calculateInterestConfidence(matches)
                };
            }
        }

        return {
            categories: categorizedInterests,
            raw_interests: interests,
            interest_count: interests.length
        };
    }

    analyzeBio(bio) {
        if (!bio) return null;

        return {
            length: bio.length,
            sentiment_indicators: this.extractSentimentIndicators(bio),
            key_phrases: this.extractKeyPhrases(bio),
            writing_style: this.analyzeWritingStyle(bio)
        };
    }

    extractSentimentIndicators(text) {
        const indicators = {
            emoji_count: (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length,
            exclamation_count: (text.match(/!/g) || []).length,
            question_count: (text.match(/\?/g) || []).length,
            capitalized_words: (text.match(/\b[A-Z]{2,}\b/g) || []).length
        };

        return {
            ...indicators,
            overall_tone: this.calculateTone(indicators)
        };
    }

    extractKeyPhrases(text) {
        const phrases = text.split(/[.,!?]+/)
            .map(phrase => phrase.trim())
            .filter(phrase => phrase.length > 10);

        return phrases.map(phrase => ({
            text: phrase,
            length: phrase.length,
            keywords: this.extractKeywords(phrase)
        }));
    }

    analyzeWritingStyle(text) {
        return {
            avg_word_length: this.calculateAvgWordLength(text),
            vocabulary_diversity: this.calculateVocabularyDiversity(text),
            formality_score: this.calculateFormalityScore(text),
            humor_indicators: this.detectHumorIndicators(text)
        };
    }

    processCategories(visualElements) {
        return Object.entries(visualElements).map(([category, elements]) => ({
            category_name: category,
            elements: elements,
            confidence_score: this.calculateCategoryConfidence(elements),
            frequency: elements.length
        }));
    }

    extractActivitySignals(visualElements) {
        const activityMapping = {
            high_energy: ['sports', 'fitness', 'adventure'],
            social: ['group', 'party', 'friends'],
            creative: ['art', 'music', 'performance'],
            outdoor: ['nature', 'hiking', 'beach']
        };

        return Object.entries(activityMapping).reduce((signals, [type, keywords]) => {
            signals[type] = this.calculateActivityScore(visualElements, keywords);
            return signals;
        }, {});
    }

    calculateConfidence(value) {
        return value ? 0.85 : 0; // Simplified confidence calculation
    }

    calculateInterestConfidence(matches) {
        return Math.min(matches.length * 0.2 + 0.6, 1);
    }

    calculateCategoryConfidence(elements) {
        return Math.min(elements.length * 0.15 + 0.7, 1);
    }

    calculateActivityScore(elements, keywords) {
        const matches = Object.values(elements).flat().filter(element =>
            keywords.some(keyword => 
                element.toLowerCase().includes(keyword)
            )
        );

        return {
            score: Math.min(matches.length * 0.25, 1),
            matching_elements: matches
        };
    }

    generateMetadata(analysisResults) {
        return {
            timestamp: new Date().toISOString(),
            version: "1.0",
            source: "profile_analyzer",
            processing_stats: {
                text_extraction_success: !!analysisResults.textInfo,
                visual_analysis_success: !!analysisResults.visualElements,
                confidence_metrics: {
                    text: this.calculateOverallTextConfidence(analysisResults.textInfo),
                    visual: this.calculateOverallVisualConfidence(analysisResults.visualElements)
                }
            }
        };
    }

    calculateOverallTextConfidence(textInfo) {
        const weights = {
            name: 0.3,
            occupation: 0.2,
            education: 0.2,
            interests: 0.15,
            bio: 0.15
        };

        return Object.entries(weights).reduce((total, [field, weight]) => {
            const hasField = !!textInfo[field];
            return total + (hasField ? weight : 0);
        }, 0);
    }

    calculateOverallVisualConfidence(visualElements) {
        return Object.keys(visualElements).length > 0 ? 
            Math.min(Object.keys(visualElements).length * 0.2, 1) : 0;
    }
}

export default ProfileDataTransformer; 