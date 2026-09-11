import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { authRateLimiter } from "../middlewares/rateLimiters";
import { asyncHandler } from "../utils/asyncHandler";
import { loginSchema, logoutSchema, refreshSchema, registerSchema } from "../validators/auth.validators";

export const authRouter = Router();

authRouter.post(
  "/register",
  authRateLimiter,
  validate(registerSchema),
  asyncHandler(authController.register),
);

authRouter.post(
  "/login",
  authRateLimiter,
  validate(loginSchema),
  asyncHandler(authController.login),
);

authRouter.post(
  "/refresh",
  validate(refreshSchema),
  asyncHandler(authController.refresh),
);

authRouter.post(
  "/logout",
  validate(logoutSchema),
  asyncHandler(authController.logout),
);
