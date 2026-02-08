import { Request, Response } from "express";
import { Favorite } from "../models/Favorite";
import { Song } from "../models/Song";

export const getFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const favorites = await Favorite.find({ userId })
      .populate({
        path: "songId",
        model: "Song",
        select: "title artist duration audioUrl thumbnailUrl albumId",
      })
      .sort({ createdAt: -1 });

    res.json(favorites);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
};

export const addToFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { songId } = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Check if song exists and belongs to user
    const song = await Song.findOne({ _id: songId, userId });
    if (!song) {
      return res.status(404).json({ error: "Song not found or unauthorized" });
    }

    // Check if already favorited
    const existing = await Favorite.findOne({ userId, songId });
    if (existing) {
      return res.status(400).json({ error: "Song already in favorites" });
    }

    const favorite = new Favorite({ userId, songId });
    await favorite.save();

    // Update song isFavorite status
    await Song.findOneAndUpdate({ _id: songId, userId }, { isFavorite: true });

    res.status(201).json(favorite);
  } catch (error) {
    res.status(400).json({ error: "Failed to add to favorites" });
  }
};

export const removeFromFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { songId } = req.params;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const favorite = await Favorite.findOneAndDelete({ songId, userId });

    if (!favorite) {
      return res
        .status(404)
        .json({ error: "Favorite not found or unauthorized" });
    }

    // Update song isFavorite status
    await Song.findOneAndUpdate({ _id: songId, userId }, { isFavorite: false });

    res.json({ message: "Removed from favorites" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove from favorites" });
  }
};
