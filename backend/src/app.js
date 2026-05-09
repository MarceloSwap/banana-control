import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { buildAdminRouter } from "./routes/adminRoutes.js";
import { buildAuthRouter } from "./routes/authRoutes.js";
import {
  buildAnalyticsRouter,
  buildInventoryRouter,
  buildResourceRouter,
  buildSummaryRouter
} from "./routes/resourceRoutes.js";
import { swaggerDocument } from "./utils/swagger.js";

export const app = express();

function isAllowedLocalFrontend(origin) {
  if (!origin) {
    return true;
  }

  if (origin === env.frontendUrl) {
    return true;
  }

  try {
    const url = new URL(origin);
    const isFrontendPort = url.port === "5173";
    const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    const isPrivateNetwork =
      /^10\./.test(url.hostname) ||
      /^192\.168\./.test(url.hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(url.hostname);

    return isFrontendPort && (isLocalhost || isPrivateNetwork);
  } catch {
    return false;
  }
}

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedLocalFrontend(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origem nao permitida pelo CORS."));
  }
}));
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/auth", buildAuthRouter());
app.use("/api/admin", buildAdminRouter());
app.use("/api/inventory", buildInventoryRouter());
app.use("/api/expenses", buildResourceRouter("expenses"));
app.use("/api/sales", buildResourceRouter("sales"));
app.use("/api/losses", buildResourceRouter("losses"));
app.use("/api/summary", buildSummaryRouter());
app.use("/api/analytics", buildAnalyticsRouter());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(error.status || 500).json({ message: error.message || "Erro interno do servidor." });
});
