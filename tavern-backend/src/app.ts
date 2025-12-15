// tavern-backend/src/app.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { apiRateLimiter } from "./middleware/rateLimit";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware";
import routes from "./routes";
import paymentRoutes from './routes/paymentRoutes';

const app = express();

// Core middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Rate limit all API routes
app.use("/api", apiRateLimiter);

// Mount all routes under /api
app.use("/api", routes);
app.use('/api/payments', paymentRoutes); // ← MOVED BEFORE ERROR HANDLERS

// 404 + error handlers (MUST BE LAST)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
