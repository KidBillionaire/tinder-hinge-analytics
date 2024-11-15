const { createWorker } = Tesseract;

async function performOCR(imageFile) {
  try {
    // Create worker with logging
    const worker = await createWorker({
      logger: m => console.log(m) // This helps debug loading issues
    });

    // Initialize worker
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    // Perform OCR
    const { data: { text } } = await worker.recognize(imageFile);
    
    // Terminate worker
    await worker.terminate();

    return text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
}

// Test function
async function testOCR() {
  const imageInput = document.getElementById('imageInput');
  
  imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await performOCR(file);
      console.log('Extracted Text:', text);
    } catch (error) {
      console.error('Failed to process image:', error);
    }
  });
} 