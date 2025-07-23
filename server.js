/** @format */

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Ensure temp directory exists
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Serve the main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Extract audio from YouTube URL
app.post("/extract-audio", async (req, res) => {
  const { youtubeUrl } = req.body;

  if (!youtubeUrl) {
    return res.status(400).json({ error: "YouTube URL is required" });
  }

  try {
    // Generate unique filename
    const filename = `audio_${Date.now()}`;
    const outputPath = path.join(tempDir, `${filename}.mp3`);

    // Use yt-dlp to extract audio (you'll need to install this separately)
    const command = `yt-dlp --extract-audio --audio-format mp3 --audio-quality 192K -o "${outputPath.replace(
      ".mp3",
      ".%(ext)s"
    )}" "${youtubeUrl}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error extracting audio:", error);
        return res
          .status(500)
          .json({ error: "Failed to extract audio from YouTube video" });
      }

      // Check if file was created
      if (fs.existsSync(outputPath)) {
        // Serve the audio file
        res.json({
          success: true,
          audioUrl: `/audio/${filename}.mp3`,
          message: "Audio extracted successfully",
        });
      } else {
        res.status(500).json({ error: "Audio file was not created" });
      }
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Serve audio files
app.get("/audio/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(tempDir, filename);

  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Accept-Ranges", "bytes");
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "Audio file not found" });
  }
});

// Clean up old files (optional)
app.delete("/cleanup/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(tempDir, filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ success: true, message: "File deleted" });
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Make sure you have yt-dlp installed: pip install yt-dlp");
});
