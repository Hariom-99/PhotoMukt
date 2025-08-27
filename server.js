const express = require("express");
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();

// Ensure required directories exist
const uploadDir = path.join(__dirname, "uploads");
const resultDir = path.join(__dirname, "public", "results");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(resultDir)) fs.mkdirSync(resultDir, { recursive: true });

// Multer setup
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "_" + Math.round(Math.random() * 1e9) + ext);
  },
});

const upload = multer({ storage });

// Serve static files (frontend in /public)
app.use(express.static("public"));

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Upload route
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const inputPath = req.file.path;
  const outputFilename =
    path.parse(req.file.filename).name + "_output.png";
  const outputPath = path.join(resultDir, outputFilename);

  const scriptPath = path.join(__dirname, "remover_bg.py");
  const pythonCmd = process.platform === "win32" ? "python" : "python3";

  console.log("Running:", pythonCmd, scriptPath, inputPath, outputPath);

  // Spawn python process
  const py = spawn(pythonCmd, [scriptPath, inputPath, outputPath]);

  py.stdout.on("data", (data) => {
    console.log(`Python stdout: ${data}`);
  });

  py.stderr.on("data", (data) => {
    console.error(`Python stderr: ${data}`);
  });

  py.on("close", (code) => {
    if (code !== 0) {
      console.error(`Python exited with code ${code}`);
      return res
        .status(500)
        .send("<h2 style='color:red;'>Background removal failed.</h2>");
    }

    console.log("✅ Background removed successfully:", outputFilename);

    // Respond with JSON (avoids protocol errors with redirects)
    res.json({ success: true, file: `/results/${outputFilename}` });

    // Cleanup after 2 minutes
    setTimeout(() => {
      try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        console.log("🗑️ Cleaned up:", inputPath, outputPath);
      } catch (e) {
        console.error("Cleanup error:", e);
      }
    }, 2 * 60 * 1000);
  });
});

// Server
const PORT = process.env.PORT || 10000; // ✅ Render needs 10000
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
