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

  // Use python3 for Render’s Linux environment
  const pythonCmd = 'python3';

  const command = `"${pythonCmd}" "${scriptPath}" "${inputPath}" "${outputPath}"`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error('Error:', err);
      console.error('Stderr:', stderr);
      return res.status(500).send('<h2 style="color:red;">Background removal failed.</h2>');
    }

    console.log('Stdout:', stdout);
    if (stderr) console.error('Stderr:', stderr);

    res.redirect(`/result.html?file=${outputFilename}`);

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

// Use Render-provided PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
