import app from './api/index.js';
import express from 'express';
import path from 'path';

const PORT = 3000;

async function startServer() {
  // Vite middleware for development vs static serve for production (only when running locally)
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Local development server running on http://localhost:${PORT}`);
  });
}

startServer();
