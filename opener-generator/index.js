const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { OpenAI } = require('openai'); // Make sure to import OpenAI instead of Configuration
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Directly pass the API key
});

app.post('/generate-opener', async (req, res) => {
    const { context, style } = req.body;

    try {
        const prompt = `Generate a ${style} opener for Tinder in the context of: ${context}`;
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', // You can also use another model like text-davinci-003
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 50,
            temperature: 0.7,
        });

        const opener = response.choices[0].message.content.trim();
        res.json({ opener });
    } catch (error) {
        console.error('Error generating opener:', error);
        res.status(500).json({ error: 'Failed to generate opener' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});