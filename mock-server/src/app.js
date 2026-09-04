import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { seedDatabase } from "./data/seed.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter, rolesRouter } from "./routes/users.js";
import {
  categoriesRouter,
  departmentsRouter,
  itGroupsRouter,
  prioritiesRouter,
  requestStatusesRouter,
} from "./routes/catalogs.js";
import { requestsRouter } from "./routes/requests.js";
import { dashboardRouter, reportsRouter } from "./routes/dashboard.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

seedDatabase();

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (req, res) => {
  res.json({
    name: "ITSupport Mock API",
    docs: "Xem docs/api-spec.yaml va docs/API_GUIDE.md o thu muc goc repo",
    health: "/health",
  });
});
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/roles", rolesRouter);
app.use("/api/departments", departmentsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/priorities", prioritiesRouter);
app.use("/api/request-statuses", requestStatusesRouter);
app.use("/api/it-groups", itGroupsRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/reports", reportsRouter);

app.use((req, res) => {
  res.status(404).json({ message: `Khong tim thay route ${req.method} ${req.path}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Loi mock server: " + err.message });
});
