// Event listener for the 'Parse Image and Extract Data' button
document.getElementById('parseImageBtn').addEventListener('click', async () => {
    const imageInput = document.getElementById('imageInput');
    const file = imageInput.files[0];
  
    if (!file) {
      alert("Please select an image file.");
      return;
    }
  
    const parseButton = document.getElementById('parseImageBtn');
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
      });
  
      if (!response.ok) {
        console.error("Server responded with an error:", response.statusText);
        alert("Server error occurred. Please try again later.");
        return;
      }
  
      const responseData = await response.json();
  
      // Access content safely
      let content;
      try {
        content = responseData.choices[0].message.content;
        if (!content) throw new Error("Content is undefined");
      } catch (error) {
        console.error("Error accessing content from GPT response:", error);
        alert("Invalid response from server. Check the console for details.");
        return;
      }
  
      console.log("Parsed content from GPT:", content);
  
      // Attempt to parse the content as JSON after cleaning it
      let data;
      try {
        // Clean up JSON if necessary
        const cleanedContent = content
          .replace(/(\r\n|\n|\r)/gm, "") // Remove line breaks
          .replace(/,\s*}/g, "}")       // Remove trailing commas before closing braces
          .replace(/,\s*]/g, "]");       // Remove trailing commas before closing brackets
  
        data = JSON.parse(cleanedContent);
      } catch (error) {
        console.error("Error parsing JSON from GPT response:", error);
        alert("Received invalid JSON format. Check the console for details.");
        return;
      }
  
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
      <td>${data.Interests ? data.Interests.join(", ") : "Unknown"}</td>
      <td>
        ${data['Additional Info'] 
          ? Object.entries(data['Additional Info']).map(([key, value]) => `${key}: ${value}`).join('<br>') 
          : "Unknown"}
      </td>
      <td>${data['Conversation Summary'] || "No recent conversations available"}</td>
      <td>${data['Next Steps'] || "No next steps suggested"}</td>
    `;
    tableBody.appendChild(row);
  }