const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', upload.single('image'), (req, res) => {
  const inputPath = req.file.path;
  const outputFilename = req.file.filename + '_output.png';
  const outputPath = path.join(__dirname, 'public', outputFilename);

  const scriptPath = path.join(__dirname, 'remover_bg.py');

  // ✅ Cross-platform python command
  const pythonCmd = process.platform === 'win32' ? 'py' : 'python3';

  const command = `"${pythonCmd}" "${scriptPath}" "${inputPath}" "${outputPath}"`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error('Error:', err);
      console.error('Stderr:', stderr);
      return res.status(500).send('<h2 style="color:red;">Background removal failed.</h2>');
    }

    console.log('Stdout:', stdout);
    if (stderr) console.error('Stderr:', stderr);

    // Redirect to results page
    res.redirect(`/result.html?file=${outputFilename}`);

    // Cleanup after 2 minutes
    setTimeout(() => {
      try {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      } catch (e) {
        console.error('File cleanup error:', e);
      }
    }, 2 * 60 * 1000);
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
