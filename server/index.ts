import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./db";
import authRoutes from "./routes/auth.routes";
import songsRoutes from "./routes/songs.routes";
import albumsRoutes from "./routes/albums.routes";
import favoritesRoutes from "./routes/favorites.routes";
import convertRoutes from "./routes/convert.routes";
import { verifyAccessToken } from "./middleware/auth.middleware";

import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS with credentials for cookies
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/songs", verifyAccessToken, songsRoutes);
app.use("/api/albums", verifyAccessToken, albumsRoutes);
app.use("/api/favorites", verifyAccessToken, favoritesRoutes);
app.use("/api/convert", verifyAccessToken, convertRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve frontend static files in production
const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));

// Handle React Router - catch all routes and serve index.html
app.use((req, res) => {
  // If request is not an API call, serve the frontend
  if (!req.url.startsWith("/api/")) {
    res.sendFile(path.join(distPath, "index.html"));
  } else {
    res.status(404).json({ error: "API route not found" });
  }
});

async function startServer() {
  // Start listening immediately so Render detects the service is up
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Then connect to the database
  await connectDB();
}

startServer();
