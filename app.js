const express = require('express');
const multer = require('multer');
const vision = require('@google-cloud/vision');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const client = new vision.ImageAnnotatorClient();

// Serve the HTML form
app.use(express.static('public'));

// Handle image upload and Vision API call
app.post('/upload', upload.single('pic'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    // Send image buffer to Google Cloud Vision
    const [result] = await client.labelDetection({
      image: { content: req.file.buffer }
    });

    const labels = result.labelAnnotations;

    // Build HTML response
    let html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Vision Results</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 60px auto;
            background: #f4f4f4;
            padding: 20px;
          }
          h1 { color: #333; }
          .label-card {
            background: white;
            padding: 12px 20px;
            margin: 8px 0;
            border-radius: 6px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
          }
          .score {
            color: #4285F4;
            font-weight: bold;
          }
          a {
            display: inline-block;
            margin-top: 20px;
            color: #4285F4;
          }
        </style>
      </head>
      <body>
        <h1>🏷️ Detected Labels</h1>
    `;

    if (labels.length === 0) {
      html += `<p>No labels detected.</p>`;
    } else {
      labels.forEach(label => {
        const score = (label.score * 100).toFixed(1);
        html += `
          <div class="label-card">
            <span>${label.description}</span>
            <span class="score">${score}%</span>
          </div>
        `;
      });
    }

    html += `<a href="/">← Upload another image</a></body></html>`;
    res.send(html);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error processing image: ' + err.message);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});