import { Router } from 'express';
import OpenAI from 'openai';
import mlService from '../services/mlService.js';

const router = Router();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Apply rate limiting middleware
router.use(mlService.getRateLimiter());

router.post('/api/generate-opener', async (req, res) => {
    try {
        const profileData = req.body;
        
        // Check ML service health before proceeding
        const healthStatus = await mlService.checkHealth();
        if (healthStatus.status !== 'healthy') {
            throw new Error('ML service is currently unavailable');
        }

        // Create a prompt based on the profile data
        const prompt = createPrompt(profileData);
        
        // Generate opener using ML service
        const mlResponse = await mlService.generateOpener(profileData);
        
        // If ML confidence is low, fallback to OpenAI
        if (mlResponse.confidence < 0.7) {
            console.log('Low confidence ML response, falling back to OpenAI');
            const openAiResponse = await generateOpenAIOpener(prompt);
            res.json({
                opener: openAiResponse.opener,
                confidence: openAiResponse.confidence,
                source: 'openai'
            });
        } else {
            res.json({
                ...mlResponse,
                source: 'ml_model'
            });
        }
    } catch (error) {
        console.error('Opener generation error:', error);
        
        // Attempt fallback to OpenAI if ML service fails
        try {
            const openAiResponse = await generateOpenAIOpener(createPrompt(req.body));
            res.json({
                ...openAiResponse,
                source: 'openai_fallback',
                error: null
            });
        } catch (fallbackError) {
            res.status(500).json({ 
                error: 'Failed to generate opener',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
                source: null
            });
        }
    }
});

async function generateOpenAIOpener(prompt) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a dating profile expert who creates engaging, personalized opening messages. Your messages are witty, relevant to the person's interests, and likely to get a response. Keep messages concise (1-2 sentences) and natural sounding.",
                    type: "system_message"
                },
                {
                    role: "user",
                    content: prompt,
                    type: "user_message"
                }
            ],
            max_tokens: 100,
            temperature: 0.7,
            presence_penalty: 0.6,
            frequency_penalty: 0.5
        });

        return {
            opener: completion.choices[0].message.content,
            confidence: 0.85,
            model: "gpt-4",
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('OpenAI generation error:', error);
        throw error;
    }
}

function createPrompt(profileData) {
    const { basic_info, interests, bio_analysis, visual_features } = profileData;
    
    let promptParts = [];
    
    // Add basic info
    if (basic_info.name) {
        promptParts.push(`Their name is ${basic_info.name}`);
    }
    if (basic_info.occupation.title) {
        promptParts.push(`works as a ${basic_info.occupation.title}`);
    }
    
    // Add interests
    if (interests.categories) {
        const interestsList = Object.entries(interests.categories)
            .map(([category, data]) => `${category}: ${data.items.join(', ')}`)
            .join('; ');
        promptParts.push(`Their interests include: ${interestsList}`);
    }
    
    // Add visual elements
    if (visual_features.detected_categories.length > 0) {
        const visualElements = visual_features.detected_categories
            .map(cat => cat.elements.join(', '))
            .join('; ');
        promptParts.push(`Their photos show: ${visualElements}`);
    }
    
    // Add writing style if available
    if (bio_analysis?.writing_style) {
        const style = bio_analysis.writing_style;
        if (style.humor_indicators > 0.5) {
            promptParts.push("They seem to have a good sense of humor");
        }
    }
    
    return `Create an engaging opener for someone who ${promptParts.join(', ')}. 
            Make it personal and reference their specific interests or background.`;
}

export default router; 