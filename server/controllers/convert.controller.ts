import { Request, Response } from "express";
import YTDlpWrapModule from "yt-dlp-wrap";
import { Song } from "../models/Song";
import path from "path";
import fs from "fs/promises";
import { existsSync, createReadStream } from "fs";

// Handle both CommonJS and ES module exports
const YTDlpWrap = (YTDlpWrapModule as any).default || YTDlpWrapModule;

// Initialize yt-dlp
const ytDlp = new YTDlpWrap("/usr/local/bin/yt-dlp");
const DOWNLOAD_DIR = path.resolve("./downloads");

// Ensure download directory exists
async function ensureDownloadDir() {
  try {
    await fs.mkdir(DOWNLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create download directory:", error);
  }
}
ensureDownloadDir();

// Extract video ID from URL
function extractVideoId(
  url: string,
): { platform: string; videoId: string } | null {
  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) return { platform: "youtube", videoId: match[1] };
  }

  // TikTok patterns
  const tiktokPattern = /tiktok\.com\/.*\/video\/(\d+)/;
  const tiktokMatch = url.match(tiktokPattern);
  if (tiktokMatch) return { platform: "tiktok", videoId: tiktokMatch[1] };

  return null;
}

// POST /api/convert - Start conversion
export const convertVideo = async (req: Request, res: Response) => {
  try {
    const { url, quality = "320" } = req.body;
    const userId = req.user?.userId;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const videoInfo = extractVideoId(url);
    if (!videoInfo) {
      return res.status(400).json({ error: "Invalid YouTube or TikTok URL" });
    }

    // Get video metadata first with speed optimization flags
    console.log("Fetching video info for:", url);
    const metadata = await (ytDlp as any)
      .execPromise([
        "--dump-json",
        "--no-playlist",
        "--no-warnings",
        "--no-check-certificates",
        "--prefer-free-formats",
        url,
      ])
      .then((output: string) => JSON.parse(output));

    if (!metadata) {
      return res
        .status(400)
        .json({ error: "Could not fetch video information" });
    }

    const title = metadata.title || "Unknown Title";
    const artist = metadata.channel || metadata.uploader || "Unknown Artist";
    const duration = Math.round(metadata.duration || 0);
    const thumbnail = metadata.thumbnail || "";

    // Generate unique filename
    const safeTitle = title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
    const outputFileName = `${videoInfo.videoId}_${Date.now()}.mp3`;
    const outputPath = path.join(DOWNLOAD_DIR, outputFileName);

    // Create song record with 'converting' status
    const song = new Song({
      title,
      artist,
      duration,
      thumbnailUrl: thumbnail,
      sourceUrl: url,
      youtubeId: videoInfo.videoId,
      youtubeUrl: url,
      bitrate: parseInt(quality),
      filePath: outputPath,
      userId,
      status: "converting",
    });

    await song.save();

    // Start background conversion
    startConversion(url, outputPath, quality, song._id.toString());

    res.status(201).json({
      success: true,
      songId: song._id,
      title,
      artist,
      duration,
      thumbnail,
    });
  } catch (error: any) {
    console.error("Conversion error:", error);
    res.status(500).json({
      error: "Failed to start conversion",
      details: error.message,
    });
  }
};

// Background conversion function
async function startConversion(
  url: string,
  outputPath: string,
  quality: string,
  songId: string,
) {
  try {
    console.log(`[Convert] Starting: ${url}`);
    console.log(`[Convert] Output: ${outputPath}`);

    // yt-dlp arguments for audio extraction - optimized for speed
    const args = [
      "-x", // Extract audio
      "--audio-format",
      "mp3", // Convert to MP3
      "--audio-quality",
      "6", // 4 is faster than 2, still good enough for mobile/web
      "--js-runtimes",
      "nodejs", // Use Node.js for JS extraction
      "--no-playlist", // Single video only
      "--no-mtime", // Don't set file mtime
      "--no-check-certificates", // Skip cert checks for speed
      "--no-call-home", // Don't contact yt-dlp servers
      "--no-warnings", // Less IO
      "-o",
      outputPath, // Output path
      url,
    ];

    console.log(`[Convert] Running: yt-dlp ${args.join(" ")}`);

    await ytDlp.execPromise(args);

    // Verify file exists
    if (!existsSync(outputPath)) {
      throw new Error("Output file not found after conversion");
    }

    // Get file stats
    const stats = await fs.stat(outputPath);
    console.log(
      `[Convert] Success! File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`,
    );

    // Update song record
    await Song.findByIdAndUpdate(songId, {
      status: "completed",
      audioUrl: `/api/convert/${songId}/stream`,
    });

    console.log(`[Convert] Completed: ${songId}`);
  } catch (error: any) {
    console.error("[Convert] Error:", error.message);

    // Update song status to failed
    await Song.findByIdAndUpdate(songId, {
      status: "failed",
      errorMessage: error.message,
    });
  }
}

// GET /api/convert/status/:songId - Check conversion status
export const getConversionStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const song = await Song.findOne({ _id: req.params.songId, userId });

    if (!song) {
      return res.status(404).json({ error: "Song not found or unauthorized" });
    }

    // Check if file exists
    let fileReady = false;
    if (song.filePath && existsSync(song.filePath)) {
      fileReady = true;
    }

    res.json({
      songId: song._id,
      status: song.status,
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      thumbnailUrl: song.thumbnailUrl,
      progress:
        song.status === "completed" ? 100 : song.status === "failed" ? 0 : 50,
      fileReady,
      errorMessage: song.errorMessage,
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({ error: "Failed to get status" });
  }
};

// GET /api/convert/:id/stream - Stream audio file
export const streamSong = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const song = await Song.findOne({ _id: req.params.id, userId });

    if (!song) {
      return res.status(404).json({ error: "Song not found or unauthorized" });
    }

    if (song.status !== "completed") {
      return res.status(400).json({ error: "Song not ready yet" });
    }

    if (!song.filePath || !existsSync(song.filePath)) {
      return res.status(404).json({ error: "Audio file not found" });
    }

    const stats = await fs.stat(song.filePath);
    const range = req.headers.range;

    if (range) {
      // Handle range requests for seeking
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${stats.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "audio/mpeg",
      });

      createReadStream(song.filePath, { start, end }).pipe(res);
    } else {
      // Full file
      res.writeHead(200, {
        "Content-Length": stats.size,
        "Content-Type": "audio/mpeg",
      });

      createReadStream(song.filePath).pipe(res);
    }
  } catch (error) {
    console.error("Stream error:", error);
    res.status(500).json({ error: "Failed to stream audio" });
  }
};

// GET /api/convert/:id/download - Download audio file
export const downloadSong = async (req: Request, res: Response) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({ error: "Song not found" });
    }

    if (!song.filePath || !existsSync(song.filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const fileName = `${song.title}.mp3`.replace(/[^a-zA-Z0-9.\- ]/g, "_");

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    createReadStream(song.filePath).pipe(res);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Failed to download" });
  }
};
