const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                'cdn.jsdelivr.net',
                'unpkg.com',
                'blob:'
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                'cdn.jsdelivr.net',
                'fonts.googleapis.com'
            ],
            imgSrc: ["'self'", 'data:', 'blob:'],
            connectSrc: [
                "'self'",
                'blob:',
                'data:',
                'fonts.googleapis.com',
                'fonts.gstatic.com',
                'raw.githubusercontent.com',
                'cdn.jsdelivr.net',
                'unpkg.com'
            ],
            fontSrc: [
                "'self'",
                'cdn.jsdelivr.net',
                'fonts.googleapis.com',
                'fonts.gstatic.com'
            ],
            workerSrc: ["'self'", 'blob:', 'data:', 'cdn.jsdelivr.net', 'unpkg.com'],
            childSrc: ["'self'", 'blob:'],
            frameSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            manifestSrc: ["'self'"],
            formAction: ["'self'"],
            scriptSrcElem: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'unpkg.com'],
            scriptSrcAttr: ["'unsafe-inline'"],
            wasmSrc: ["'self'", 'blob:', 'data:', 'cdn.jsdelivr.net', 'unpkg.com']
        }
    },
    crossOriginEmbedderPolicy: { policy: "credentialless" },
    crossOriginOpenerPolicy: { policy: "same-origin" }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// API routes
app.post('/api/generate-opener', (req, res) => {
    // Placeholder for opener generation endpoint
    res.json({
        opener: "Hey! I noticed you're into [interest]. What's your favorite [related question]?",
        confidence: 0.85
    });
});

app.post('/api/analyze-profiles', async (req, res) => {
    try {
        const { results } = req.body;
        
        // Here you would typically process the results further,
        // store them in a database, etc.
        
        res.json({
            success: true,
            message: 'Analysis results processed successfully',
            count: results.length
        });
    } catch (error) {
        console.error('Profile analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process analysis results'
        });
    }
});

app.post('/api/parse-text', express.json(), async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ 
                error: 'No text provided' 
            });
        }

        // Add text processing logic here
        const processedText = {
            raw: text,
            wordCount: text.split(/\s+/).length,
            // Extract profile information
            profile: {
                name: text.match(/^([^\d\n]+)/)?.[1]?.trim(), // First line before numbers
                age: text.match(/\b\d{1,2}\b/)?.[0], // First 1-2 digit number
                location: text.match(/Lives in ([^\n]+)/)?.[1],
                distance: text.match(/(\d+) miles away/)?.[1],
                anthem: text.match(/My Anthem\s*([^\n]+)/)?.[1],
                lifestyle: text.match(/Lifestyle\s*([^\n]+)/)?.[1],
            }
        };

        res.json(processedText);
    } catch (error) {
        console.error('Text parsing error:', error);
        res.status(500).json({ 
            error: 'Failed to parse text',
            details: error.message 
        });
    }
});

// Handle 404s
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Add these headers to allow Tesseract.js to work properly
app.use((req, res, next) => {
    res.header('Cross-Origin-Opener-Policy', 'same-origin');
    res.header('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Add MIME type mapping for .wasm files
app.use(express.static('public', {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.wasm')) {
            res.set('Content-Type', 'application/wasm');
        }
        if (filePath.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
    }
}));

// Add specific route for worker files
app.get('/js/worker.min.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'js', 'worker.min.js'), {
        headers: {
            'Content-Type': 'application/javascript'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the dashboard`);
});