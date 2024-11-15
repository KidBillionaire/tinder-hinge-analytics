import fs from 'fs';
import path from 'path';
import https from 'https';

const SAMPLE_IMAGES = [
    {
        name: 'clear_text_profile.jpg',
        url: 'https://example.com/sample1.jpg'  // Replace with actual URLs
    },
    {
        name: 'multiple_photos_profile.jpg',
        url: 'https://example.com/sample2.jpg'
    },
    {
        name: 'low_quality_image.jpg',
        url: 'https://example.com/sample3.jpg'
    }
];

const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures', 'sample_profiles');

// Create fixtures directory if it doesn't exist
if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
}

// Download sample images
SAMPLE_IMAGES.forEach(({ name, url }) => {
    const filePath = path.join(fixturesDir, name);
    if (!fs.existsSync(filePath)) {
        https.get(url, (response) => {
            const fileStream = fs.createWriteStream(filePath);
            response.pipe(fileStream);
            fileStream.on('finish', () => {
                console.log(`Downloaded: ${name}`);
            });
        }).on('error', (err) => {
            console.error(`Error downloading ${name}:`, err);
        });
    }
}); 