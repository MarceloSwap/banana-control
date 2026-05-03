import { Router } from "express";
import {
  blockUser,
  dashboard,
  producers,
  registerAdmin,
  reports,
  removeUser
} from "../controllers/AdminController.js";
import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";

export function buildAdminRouter() {
  const router = Router();

  router.use(authenticate, authorizeAdmin);
  router.get("/dashboard", dashboard);
  router.get("/relatorios", reports);
  router.get("/users", producers);
  router.patch("/users/:id/block", blockUser);
  router.delete("/users/:id", removeUser);
  router.post("/admins", registerAdmin);

  return router;
}
