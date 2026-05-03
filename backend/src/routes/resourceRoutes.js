import { Router } from "express";
import {
  analyticsController,
  buildResourceController,
  summaryController
} from "../controllers/resourceController.js";

export function buildResourceRouter(resource) {
  const router = Router();
  const controller = buildResourceController(resource);

  router.get("/", controller.list);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.remove);

  return router;
}

export function buildSummaryRouter() {
  const router = Router();
  router.get("/", summaryController);
  return router;
}

export function buildAnalyticsRouter() {
  const router = Router();
  router.get("/", analyticsController);
  return router;
}
