import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import cors from 'cors';

dotenv.config();  // Load environment variables

const PORT = process.env.PORT || 3000;
const app = express(); // Initialize the app instance

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "script-src 'self' 'unsafe-eval';");
  next();
});

// Ensure the OpenAI API key is present
if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OpenAI API key not found in environment variables.");
  process.exit(1);
}

// Clean OCR text function
const cleanOCRText = (text) => {
  return text.trim(); // Add more cleaning logic as needed
};

// Endpoint to parse text
app.post('/parse-text', async (req, res) => {
    let { text } = req.body;

    // Clean the OCR text
    text = cleanOCRText(text);

    try {
        console.log('OCR text received:', text); // Debug log

        const prompt = `
You are an assistant that extracts structured data for a Tinder dating profile from text. 
Please extract as much information as possible about the following profile from the given text and return it as a valid JSON object with the following keys:
- Name
- Age
- Job/Occupation
- Interests
- Location
- Bio (optional)
- LinkedIn or Website (if provided)

Do not include any unnecessary information. Only return the JSON object and exclude any extra text or explanations.

Here is the text to extract data from:

"${text}"

Please return the data in the following JSON format:

{
  "Name": "Michael Novati",
  "Age": 25,
  "Job/Occupation": "Software Engineer",
  "Interests": ["Coding", "Software Development"],
  "Location": "Silicon Valley",
  "Bio": "B2B Background",
  "LinkedIn/Website": "www.linkedin.com/in/michaelnovati"
}
`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are an assistant that extracts structured data for a Tinder dating profile." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 200,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Error response from OpenAI API:', errorBody);
            res.status(response.status).json({ error: errorBody });
            return;
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        res.status(500).send('Failed to parse the text');
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});