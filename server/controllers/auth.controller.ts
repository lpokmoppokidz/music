import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { RefreshToken, generateRefreshToken } from "../models/RefreshToken";
import { Song } from "../models/Song";
import { Album } from "../models/Album";
import { Favorite } from "../models/Favorite";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { OAuth2Client } from "google-auth-library";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret-change-in-production";
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// Generate access token (short-lived, stateless JWT)
function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

// Generate refresh token (long-lived, stored in DB)
async function createRefreshToken(
  userId: string,
  req: Request,
): Promise<string> {
  const tokenString = generateRefreshToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await RefreshToken.create({
    token: tokenString,
    userId,
    expiresAt,
    deviceInfo: req.headers["user-agent"],
    ipAddress: req.ip,
  });

  return tokenString;
}

// Set refresh token as httpOnly cookie
function setRefreshTokenCookie(res: Response, token: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

// Clear refresh token cookie
function clearRefreshTokenCookie(res: Response) {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}

// Google Login Controller
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "ID Token is required" });
    }

    // 1. Verify token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: "Invalid ID Token" });
    }

    // 2. Find or Create User
    let user = await User.findOne({ email: payload.email });

    if (!user) {
      // Create user if not exists
      user = new User({
        email: payload.email,
        displayName: payload.name || "Google User",
        avatarUrl: payload.picture,
        googleId: payload.sub,
        // No password needed for OAuth-only users
      });
      await user.save();
      console.log(`[Auth] New user registered via Google: ${payload.email}`);
    } else if (!user.googleId) {
      // Link Google account to existing email if not linked
      user.googleId = payload.sub;
      if (!user.avatarUrl) user.avatarUrl = payload.picture;
      await user.save();
      console.log(`[Auth] Google linked to existing account: ${payload.email}`);
    }

    // 3. Generate tokens (same as traditional login)
    const userIdString = user._id.toString();
    const accessToken = generateAccessToken(userIdString);
    const refreshToken = await createRefreshToken(userIdString, req);

    console.log(`[Auth] Google Login successful for user: ${userIdString}`);

    // Set refresh token cookie
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      accessToken,
      user: {
        id: userIdString,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: any) {
    console.error("[Auth] Google Login Error:", error.stack || error.message);
    res.status(500).json({ error: "Google authentication failed" });
  }
};

// Register
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = new User({ email, password, displayName });
    await user.save();

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = await createRefreshToken(user._id.toString(), req);

    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    res
      .status(500)
      .json({ error: "Registration failed", details: error.message });
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = await createRefreshToken(user._id.toString(), req);

    setRefreshTokenCookie(res, refreshToken);

    res.json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

// Refresh token
export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshTokenString = req.cookies.refreshToken;

    if (!refreshTokenString) {
      return res.status(401).json({ error: "No refresh token" });
    }

    const refreshTokenDoc = await RefreshToken.findOne({
      token: refreshTokenString,
      revokedAt: { $exists: false },
    });

    if (!refreshTokenDoc) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    if (refreshTokenDoc.expiresAt < new Date()) {
      await RefreshToken.updateOne(
        { _id: refreshTokenDoc._id },
        { revokedAt: new Date() },
      );
      clearRefreshTokenCookie(res);
      return res.status(401).json({ error: "Refresh token expired" });
    }

    const user = await User.findById(refreshTokenDoc.userId);
    if (!user) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ error: "User not found" });
    }

    await RefreshToken.updateOne(
      { _id: refreshTokenDoc._id },
      { revokedAt: new Date() },
    );

    const newAccessToken = generateAccessToken(user._id.toString());
    const newRefreshToken = await createRefreshToken(user._id.toString(), req);

    await RefreshToken.updateOne(
      { _id: refreshTokenDoc._id },
      { replacedByToken: newRefreshToken },
    );

    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      accessToken: newAccessToken,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Refresh error:", error);
    clearRefreshTokenCookie(res);
    res.status(500).json({ error: "Token refresh failed" });
  }
};

// Logout (Clear session and tokens)
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshTokenString = req.cookies.refreshToken;

    if (refreshTokenString) {
      // Revoke the current refresh token
      await RefreshToken.updateOne(
        { token: refreshTokenString, revokedAt: { $exists: false } },
        { revokedAt: new Date() },
      );
    }

    console.log(`[Auth] User logged out successfully`);

    clearRefreshTokenCookie(res);
    res.json({
      message: "Logged out successfully",
    });
  } catch (error: any) {
    console.error("Logout error:", error);
    clearRefreshTokenCookie(res);
    res.status(500).json({ error: "Logout failed" });
  }
};

// Logout all devices
export const logoutAll = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await RefreshToken.updateMany(
      { userId, revokedAt: { $exists: false } },
      { revokedAt: new Date() },
    );

    clearRefreshTokenCookie(res);
    res.json({ message: "Logged out from all devices" });
  } catch (error) {
    res.status(500).json({ error: "Logout failed" });
  }
};

// Get me
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get user" });
  }
};
