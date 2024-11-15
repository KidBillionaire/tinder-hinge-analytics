const fs = require('fs');
const path = require('path');
const https = require('https');

const setup = async () => {
    // Create directories if they don't exist
    const dirs = [
        'public/js',
        'public/lang-data'
    ];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    // Define files to copy from node_modules
    const localFiles = [
        {
            src: 'node_modules/tesseract.js/dist/worker.min.js',
            dest: 'public/js/worker.min.js'
        },
        {
            src: 'node_modules/tesseract.js/dist/tesseract-core.wasm.js',
            dest: 'public/js/tesseract-core.wasm.js'
        }
    ];

    // Copy local files
    localFiles.forEach(file => {
        if (fs.existsSync(file.src)) {
            fs.copyFileSync(
                path.join(process.cwd(), file.src),
                path.join(process.cwd(), file.dest)
            );
            console.log(`Copied ${file.src} to ${file.dest}`);
        } else {
            console.error(`Source file not found: ${file.src}`);
        }
    });

    // Download language data
    const langUrl = 'https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0/eng.traineddata.gz';
    const langPath = path.join(process.cwd(), 'public/lang-data/eng.traineddata.gz');

    await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(langPath);
        https.get(langUrl, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log('Downloaded language file successfully');
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(langPath, () => {});
            reject(err);
        });
    });

    console.log('Tesseract files setup completed');
};

setup().catch(console.error); 