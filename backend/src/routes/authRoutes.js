import { Router } from "express";
import { forgotPassword, login, register } from "../controllers/AuthController.js";

export function buildAuthRouter() {
  const router = Router();

  router.post("/register", register);
  router.post("/login", login);
  router.post("/forgot-password", forgotPassword);

  return router;
}
