import express from "express";
import {
  getMe,
  login,
  logout,
  register,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register); // POST /api/auth/register
router.post("/login", login); // POST /api/auth/login
router.post("/logout", protect, logout); // POST /api/auth/logout
router.get("/me", protect, getMe); // GET  /api/auth/me

export default router;
