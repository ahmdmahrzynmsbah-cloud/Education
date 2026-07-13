import express from "express";
import path from "path";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import { exec } from "child_process";
import { createServer as createViteServer } from "vite";

// Helper function to apply faststart to video files
function applyFaststart(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!filePath.match(/\.(mp4|mov|m4v)$/i)) {
      return resolve();
    }
    const tempPath = filePath + '.tmp.mp4';
    exec(`ffmpeg -i "${filePath}" -c copy -movflags +faststart "${tempPath}" -y`, (error) => {
      if (error) {
        console.error('Faststart failed:', error);
        // If it fails, just use the original file
        resolve();
      } else {
        fs.rename(tempPath, filePath, (err) => {
          if (err) console.error('Error renaming after faststart:', err);
          resolve();
        });
      }
    });
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Allow cors
  app.use(cors());

  // Setup upload directory
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Serve static uploads
  app.use('/uploads', express.static(uploadDir));

  // Configure Multer
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'))
    }
  });

  const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 1024 } // 1GB
  });

  app.use(express.json({ limit: '1024mb' }));
  app.use(express.urlencoded({ limit: '1024mb', extended: true }));

  // API Route for upload
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }
    
    await applyFaststart(req.file.path);

    // Return the URL to the uploaded file
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  // Gemini AI Chat Route
  app.post('/api/chat', async (req, res) => {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is missing' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const { prompt, history, context } = req.body;
      
      let fullPrompt = "";
      if (context) {
         fullPrompt += `System Context: ${context}\n\n`;
      }
      
      if (history && history.length > 0) {
         fullPrompt += "Conversation History:\n";
         history.forEach((msg: any) => {
            fullPrompt += `${msg.role}: ${msg.content}\n`;
         });
         fullPrompt += "\n";
      }
      
      fullPrompt += `User: ${prompt}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || 'Failed to generate content' });
    }
  });

  // API Route for chunked upload
  app.post('/api/upload-chunk', upload.single('chunk'), (req, res) => {
    const { fileId, chunkIndex } = req.body;
    const chunkFile = req.file;
    if (!chunkFile || !fileId) {
      res.status(400).json({ error: 'Missing chunk or fileId' });
      return;
    }

    const chunkDir = path.join(uploadDir, 'chunks', fileId);
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }

    fs.renameSync(chunkFile.path, path.join(chunkDir, chunkIndex.toString()));
    res.json({ success: true });
  });

  app.post('/api/upload-merge', express.json(), (req, res) => {
    const { fileId, totalChunks, originalName } = req.body;
    const chunkDir = path.join(uploadDir, 'chunks', fileId);
    const finalFilename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + originalName.replace(/[^a-zA-Z0-9.]/g, '_');
    const finalPath = path.join(uploadDir, finalFilename);

    try {
      const writeStream = fs.createWriteStream(finalPath);
      for (let i = 0; i < parseInt(totalChunks); i++) {
        const chunkPath = path.join(chunkDir, i.toString());
        if (fs.existsSync(chunkPath)) {
          const chunkData = fs.readFileSync(chunkPath);
          writeStream.write(chunkData);
          fs.unlinkSync(chunkPath);
        } else {
          throw new Error('Missing chunk ' + i);
        }
      }
      
      writeStream.end(async () => {
        fs.rmdirSync(chunkDir);
        await applyFaststart(finalPath);
        res.json({ url: `/uploads/${finalFilename}` });
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to merge chunks' });
    }
  });

  // Video player route to wrap video in HTML to avoid iframe download issues
  app.get('/play', (req, res) => {
    const v = req.query.v as string;
    if (!v) return res.status(400).send('No video specified');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { margin: 0; background: black; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
          video { width: 100%; height: 100%; outline: none; }
        </style>
      </head>
      <body>
        <video controls playsinline preload="auto">
          <source src="/uploads/${v}" type="video/mp4" />
        </video>
      </body>
      </html>
    `);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
