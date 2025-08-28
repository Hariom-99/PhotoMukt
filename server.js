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

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/results", express.static(resultDir));

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Result page
app.get("/result", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "result.html"));
});

// Upload route
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }

  const inputPath = req.file.path;
  const outputFilename = path.parse(req.file.filename).name + "_output.png";
  const outputPath = path.join(resultDir, outputFilename);
  const scriptPath = path.join(__dirname, "remover_bg.py");

  // ✅ Use "py" on Windows, "python3" on Linux (Render/Railway)
  const pythonCmd = process.platform === "win32" ? "py" : "python3";

  console.log("Running:", pythonCmd, scriptPath, inputPath, outputPath);

  const py = spawn(pythonCmd, [scriptPath, inputPath, outputPath]);

  py.stdout.on("data", (data) => console.log(`Python stdout: ${data.toString()}`));
  py.stderr.on("data", (data) => console.error(`Python stderr: ${data.toString()}`));

  py.on("close", (code) => {
    if (code !== 0) {
      console.error(`Python exited with code ${code}`);
      return res.status(500).send("Background removal failed");
    }

    console.log("✅ Background removed successfully:", outputFilename);

    // Redirect user to result page with query param
    res.redirect(`/result?file=${outputFilename}`);

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
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
