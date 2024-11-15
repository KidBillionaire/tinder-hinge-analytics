require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

console.log("OpenAI API Key:", process.env.OPENAI_API_KEY);

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post('/generate-opener', async (req, res) => {
    const { context, style } = req.body;

    try {
        const prompt = `Generate a ${style} opener for Tinder in the context of: ${context}`;
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            max_tokens: 50,
            temperature: 0.7,
        });

        const opener = response.data.choices[0].text.trim();
        res.json({ opener });
    } catch (error) {
        console.error('Error generating opener:', error);
        res.status(500).json({ error: 'Failed to generate opener' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
