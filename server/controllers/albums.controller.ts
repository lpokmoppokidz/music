import { Request, Response } from "express";
import { Album } from "../models/Album";
import { Song } from "../models/Song";

export const getAlbums = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const albums = await Album.find({ userId })
      .populate("songs", "title artist duration")
      .sort({ createdAt: -1 });

    res.json(albums);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch albums" });
  }
};

export const getAlbumById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const album = await Album.findOne({ _id: req.params.id, userId }).populate(
      "songs",
      "title artist duration audioUrl thumbnailUrl isFavorite",
    );

    if (!album) {
      return res.status(404).json({ error: "Album not found" });
    }

    res.json(album);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch album" });
  }
};

export const createAlbum = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const album = new Album({ ...req.body, userId });
    await album.save();
    res.status(201).json(album);
  } catch (error) {
    res.status(400).json({ error: "Failed to create album" });
  }
};

export const updateAlbum = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const album = await Album.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true },
    );

    if (!album) {
      return res.status(404).json({ error: "Album not found or unauthorized" });
    }

    res.json(album);
  } catch (error) {
    res.status(400).json({ error: "Failed to update album" });
  }
};

export const deleteAlbum = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const album = await Album.findOneAndDelete({ _id: req.params.id, userId });

    if (!album) {
      return res.status(404).json({ error: "Album not found or unauthorized" });
    }

    res.json({ message: "Album deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete album" });
  }
};

export const addSongToAlbum = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Ensure song exists and belongs to user
    const song = await Song.findOne({ _id: req.body.songId, userId });
    if (!song) {
      return res.status(404).json({ error: "Song not found or unauthorized" });
    }

    const album = await Album.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $addToSet: { songs: req.body.songId } },
      { new: true },
    );

    if (!album) {
      return res.status(404).json({ error: "Album not found or unauthorized" });
    }

    res.json(album);
  } catch (error) {
    res.status(400).json({ error: "Failed to add song to album" });
  }
};
