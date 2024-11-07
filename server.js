// server.js

// Load environment variables from .env file, if available
require('dotenv').config();

// Import required modules
const express = require('express');
const path = require('path');

// Initialize the Express application
const app = express();

// Set the port (from environment variable or default to 3000)
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Home route - serves the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Example API route - retrieve some data
app.get('/api/data', (req, res) => {
    res.json({
        message: 'Welcome to the Tinder and Hinge Analytics API!',
        timestamp: new Date().toISOString()
    });
});

// Example API route - save data (e.g., for tracking user inputs)
app.post('/api/save', (req, res) => {
    const { name, message } = req.body;
    
    // Here you would normally save the data to a database.
    // For now, we just log it and return a success message.
    console.log('Received data:', { name, message });
    
    res.status(201).json({
        success: true,
        message: 'Data saved successfully',
        data: { name, message }
    });
});

// 404 Error handling for unknown routes
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});