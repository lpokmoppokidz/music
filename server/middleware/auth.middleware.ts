import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string };
    }
  }
}

export function verifyAccessToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    let token = "";
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.user = { userId: decoded.userId };

    next();
  } catch (error: any) {
    console.error("[Auth] Verification failed:", error.message);
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Token expired" });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.status(500).json({ error: "Authentication failed" });
  }
}
