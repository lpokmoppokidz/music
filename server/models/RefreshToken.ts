import mongoose from "mongoose";
import crypto from "crypto";

export interface IRefreshToken {
  _id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
  replacedByToken?: string;
  deviceInfo?: string;
  ipAddress?: string;
}

const refreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
    },
    replacedByToken: {
      type: String,
    },
    deviceInfo: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Auto-expire documents after expiresAt
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Generate secure opaque refresh token
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
