import { Router } from "express";
import {
  addStockController,
  analyticsController,
  buildResourceController,
  summaryController
} from "../controllers/resourceController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

export function buildResourceRouter(resource) {
  const router = Router();
  const controller = buildResourceController(resource);

  router.use(authenticate);
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.remove);

  return router;
}

export function buildSummaryRouter() {
  const router = Router();
  router.use(authenticate);
  router.get("/", summaryController);
  return router;
}

export function buildAnalyticsRouter() {
  const router = Router();
  router.use(authenticate);
  router.get("/", analyticsController);
  return router;
}

export function buildInventoryRouter() {
  const router = Router();
  router.use(authenticate);
  router.post("/add", addStockController);
  return router;
}
