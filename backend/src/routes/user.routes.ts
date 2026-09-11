import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  changePasswordSchema,
  searchUsersSchema,
  updatePrivacySchema,
  updateProfileSchema,
} from "../validators/user.validators";

export const userRouter = Router();
userRouter.use(requireAuth);

userRouter.get("/me", asyncHandler(userController.me));
userRouter.patch("/me/profile", validate(updateProfileSchema), asyncHandler(userController.updateProfile));
userRouter.patch("/me/privacy", validate(updatePrivacySchema), asyncHandler(userController.updatePrivacy));
userRouter.post(
  "/me/change-password",
  validate(changePasswordSchema),
  asyncHandler(userController.changePassword),
);
userRouter.get("/me/security-events", asyncHandler(userController.securityEvents));
userRouter.get("/search", validate(searchUsersSchema), asyncHandler(userController.search));
userRouter.get("/:userId/primary-device", asyncHandler(userController.primaryDevice));
userRouter.get("/:userId", asyncHandler(userController.getById));
