// script.js

// Event listener for the 'Parse Image and Extract Data' button
document.getElementById('parseImageBtn').addEventListener('click', async () => {
  const imageInput = document.getElementById('imageInput');
  const parseButton = document.getElementById('parseImageBtn');

  const file = imageInput.files[0];

  if (!file) {
    alert("Please select an image file.");
    return;
  }

  parseButton.innerText = 'Parsing...';

  try {
    // OCR extraction using Tesseract.js
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: m => console.log("OCR progress:", m),
    });

    console.log("Extracted text from image:", text);

    // Send the extracted text to the server for GPT processing
    const response = await fetch('/parse-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      credentials: 'include'
    });

    // Check if the response is OK
    if (!response.ok) {
      console.error("Server responded with an error:", response.statusText);
      alert("Server error occurred. Please try again later.");
      return;
    }

    // Parse the JSON response
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error("Error parsing JSON from server response:", error);
      alert("Received invalid JSON format. Check the console for details.");
      return;
    }

    console.log("Parsed data:", data);

    // Display the data in the table
    addDataToTable(data);

  } catch (error) {
    console.error("Error during OCR or text parsing:", error);
    alert("An error occurred while processing the image. Please check the console for details.");
  } finally {
    parseButton.innerText = 'Parse Image and Extract Data';
  }
});

// Function to add data to the HTML table
function addDataToTable(data) {
  const tableBody = document.getElementById('profileTable').querySelector('tbody');
  tableBody.innerHTML = ''; // Clear previous data

  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${data.Name || "Unknown"}</td>
    <td>${data.Age || "Unknown"}</td>
    <td>${data.Job || "Unknown"}</td>
    <td>${data.Interests || "Unknown"}</td>
    <td>${data['Additional Info'] || "Unknown"}</td>
    <td>${data['Conversation Summary'] || "No recent conversations available"}</td>
    <td>${data['Next Steps'] || "No next steps suggested"}</td>
  `;
  tableBody.appendChild(row);
}
