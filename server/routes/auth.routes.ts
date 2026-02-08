import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
  googleLogin,
} from "../controllers/auth.controller";
import { verifyAccessToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.post("/refresh", refresh);
router.post("/logout", verifyAccessToken, logout);
router.post("/logout-all", verifyAccessToken, logoutAll);
router.get("/me", verifyAccessToken, getMe);

export default router;
