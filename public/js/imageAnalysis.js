class ProfileImageAnalyzer {
    constructor() {
        if (typeof Tesseract === 'undefined') {
            throw new Error('Tesseract.js is not loaded');
        }
        this.worker = null;
        this.initializationPromise = this.initTesseract();
    }

    async initTesseract() {
        try {
            this.worker = await Tesseract.createWorker({
                logger: m => {
                    console.log('OCR progress:', m);
                    const progressElement = document.getElementById('ocrProgress');
                    if (progressElement) {
                        progressElement.innerHTML = `
                            <div class="alert alert-info">
                                ${m.status}: ${Math.round((m.progress || 0) * 100)}%
                            </div>
                        `;
                    }
                },
                errorHandler: err => {
                    console.error('Tesseract Error:', err);
                    throw new Error(err?.message || 'Tesseract initialization failed');
                },
                workerPath: '/js/worker.min.js',
                corePath: '/js/tesseract-core.wasm.js',
                langPath: '/lang-data'
            });

            try {
                await this.worker.loadLanguage('eng');
            } catch (error) {
                console.error('Language load error:', error);
                throw new Error(`Failed to load language: ${error.message}`);
            }

            try {
                await this.worker.initialize('eng');
            } catch (error) {
                console.error('Initialization error:', error);
                throw new Error(`Failed to initialize worker: ${error.message}`);
            }

            console.log('Tesseract initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Tesseract:', error);
            throw error;
        }
    }

    async analyzeImage(imageFile) {
        if (!this.worker) {
            throw new Error('Tesseract worker not initialized');
        }

        try {
            const { data: { text } } = await this.worker.recognize(imageFile);
            
            // Send text to server for parsing with correct endpoint path
            const response = await fetch('/api/parse-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            const analysis = await response.json();

            // Combine local and server analysis
            return {
                ...analysis,
                hasText: text.length > 0,
                containsUrls: /https?:\/\/[^\s]+/.test(text),
                containsEmail: /[\w.-]+@[\w.-]+\.\w+/.test(text),
                containsPhoneNumber: /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(text),
            };
        } catch (error) {
            console.error('Image analysis failed:', error);
            throw error;
        }
    }

    async cleanup() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
        }
    }
}

export default ProfileImageAnalyzer; 