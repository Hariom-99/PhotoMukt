const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();

// Ensure uploads & results directories exist
const uploadDir = path.join(__dirname, 'uploads');
const resultDir = path.join(__dirname, 'public', 'results');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(resultDir)) fs.mkdirSync(resultDir);

const upload = multer({ dest: uploadDir });

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', upload.single('image'), (req, res) => {
  const inputPath = path.join(__dirname, req.file.path);
  const outputFilename = req.file.filename + '_output.png';
  const outputPath = path.join(resultDir, outputFilename);

  const scriptPath = path.join(__dirname, 'remover_bg.py');
  const pythonCmd = 'python3';

  // Use spawn instead of exec (streaming, lower memory usage)
  const py = spawn(pythonCmd, [scriptPath, inputPath, outputPath]);

  py.stdout.on('data', (data) => {
    console.log(`Python stdout: ${data}`);
  });

  py.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data}`);
  });

  py.on('close', (code) => {
    if (code !== 0) {
      console.error(`Python script exited with code ${code}`);
      return res
        .status(500)
        .send('<h2 style="color:red;">Background removal failed.</h2>');
    }

    // Redirect to result page
    res.redirect(`/result.html?file=results/${outputFilename}`);

    // Cleanup input & output after 2 min
    setTimeout(() => {
      try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (e) {
        console.error('Cleanup error:', e);
      }
    }, 2 * 60 * 1000);
  });
});

// Render-provided port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
