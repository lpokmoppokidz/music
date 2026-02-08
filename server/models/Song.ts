import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artist: { type: String, required: true },
    albumId: { type: mongoose.Schema.Types.ObjectId, ref: "Album" },
    duration: { type: Number, required: true },
    audioUrl: { type: String },
    thumbnailUrl: { type: String },
    sourceUrl: { type: String },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isFavorite: { type: Boolean, default: false },
    // YouTube conversion fields
    youtubeId: { type: String },
    youtubeUrl: { type: String },
    bitrate: { type: Number, default: 320 },
    filePath: { type: String },
    status: {
      type: String,
      enum: ["pending", "converting", "completed", "failed"],
      default: "pending",
    },
    errorMessage: { type: String },
  },
  {
    timestamps: true,
  },
);

export const Song = mongoose.model("Song", songSchema);
