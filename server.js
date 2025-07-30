// const express = require('express');
// const multer = require('multer');
// const { exec } = require('child_process');
// const path = require('path');
// const fs = require('fs');

// const app = express();

// const upload = multer({ dest: 'uploads/' });

// app.use(express.static('public'));

// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });
// app.post('/upload', upload.single('image'), (req, res) => {
//   const inputPath = req.file.path;
//   const outputFilename = req.file.filename + '_output.png';
//   const outputPath = path.join(__dirname, 'public', outputFilename);

//   const scriptPath = path.join(__dirname, 'remover_bg.py');
//   const pythonPath = 'C:/Users/Asus/AppData/Local/Programs/Python/Python311/python.exe';
//   //const pythonPath = 'C:/Users/Asus/AppData/Local/Programs/Python/Python311/python.exe';
//   const command = `"${pythonPath}" "${scriptPath}" "${inputPath}" "${outputPath}"`;

//   exec(command, (err, stdout, stderr) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send('<h2 style="color:red;">Background removal failed.</h2>');
//     }
//     console.log(stdout);

//     res.redirect(`/result.html?file=${outputFilename}`);

//     setTimeout(() => {
//       try {
//         fs.unlinkSync(inputPath);
//         fs.unlinkSync(outputPath);
//       } catch {};
//     }, 2 * 60 * 1000);
//   });
// });

// app.listen(3000, () => console.log('Server running on http://localhost:3000'));
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
  const pythonPath = 'python3'; // Generalized for cross-platform compatibility

  const command = `"${pythonPath}" "${scriptPath}" "${inputPath}" "${outputPath}"`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error('Error:', err);
      console.error('Stderr:', stderr);
      return res.status(500).send('<h2 style="color:red;">Background removal failed.</h2>');
    }

    console.log(stdout);
    res.redirect(`/result.html?file=${outputFilename}`);

    setTimeout(() => {
      try {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      } catch (e) {
        console.error('File cleanup error:', e);
      }
    }, 2 * 60 * 1000); // Clean up files after 2 minutes
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
