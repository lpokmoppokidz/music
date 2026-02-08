import { Router } from "express";
import { verifyAccessToken } from "../middleware/auth.middleware";
import {
  getSongs,
  getSongById,
  createSong,
  updateSong,
  deleteSong,
} from "../controllers/songs.controller";

const router = Router();

router.get("/", verifyAccessToken, getSongs);
router.post("/", verifyAccessToken, createSong);
router.get("/:id", verifyAccessToken, getSongById);
router.patch("/:id", verifyAccessToken, updateSong);
router.delete("/:id", verifyAccessToken, deleteSong);

export default router;
