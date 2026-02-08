import { Router } from "express";
import {
  convertVideo,
  getConversionStatus,
  streamSong,
  downloadSong,
} from "../controllers/convert.controller";
import { verifyAccessToken } from "../middleware/auth.middleware";

const router = Router();

// POST /api/convert - Start new conversion
router.post("/", verifyAccessToken, convertVideo);

// GET /api/convert/status/:songId - Check conversion progress
router.get("/status/:songId", verifyAccessToken, getConversionStatus);

// GET /api/convert/:id/stream - Stream audio (for playback)
router.get("/:id/stream", streamSong);

// GET /api/convert/:id/download - Download audio file
router.get("/:id/download", downloadSong);

export default router;
