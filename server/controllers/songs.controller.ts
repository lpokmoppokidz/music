import { Request, Response } from "express";
import { Song } from "../models/Song";

export const getSongs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    console.log(`[Songs] Fetching songs for user: ${userId}`);

    const songs = await Song.find({ userId })
      .populate("albumId", "name coverUrl")
      .sort({ createdAt: -1 });

    res.json(songs);
  } catch (error) {
    console.error("[Songs] Error fetching songs:", error);
    res.status(500).json({ error: "Failed to fetch songs" });
  }
};

export const getSongById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const song = await Song.findOne({ _id: req.params.id, userId }).populate(
      "albumId",
      "name coverImageUrl",
    );

    if (!song) {
      return res.status(404).json({ error: "Song not found or unauthorized" });
    }

    res.json(song);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch song" });
  }
};

export const createSong = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const song = new Song({ ...req.body, userId });
    await song.save();
    res.status(201).json(song);
  } catch (error) {
    res.status(400).json({ error: "Failed to create song" });
  }
};

export const updateSong = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const song = await Song.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true },
    );

    if (!song) {
      return res.status(404).json({ error: "Song not found or unauthorized" });
    }

    res.json(song);
  } catch (error) {
    res.status(400).json({ error: "Failed to update song" });
  }
};

export const deleteSong = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const song = await Song.findOneAndDelete({ _id: req.params.id, userId });

    if (!song) {
      return res.status(404).json({ error: "Song not found or unauthorized" });
    }

    res.json({ message: "Song deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete song" });
  }
};
