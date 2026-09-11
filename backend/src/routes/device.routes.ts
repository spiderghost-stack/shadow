import { Router } from "express";
import { deviceController } from "../controllers/device.controller";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getDeviceBundleSchema,
  renameDeviceSchema,
  replenishPreKeysSchema,
  setPushTokenSchema,
} from "../validators/device.validators";

export const deviceRouter = Router();
deviceRouter.use(requireAuth);

deviceRouter.get("/", asyncHandler(deviceController.list));
deviceRouter.get(
  "/:deviceId/bundle",
  validate(getDeviceBundleSchema),
  asyncHandler(deviceController.getBundle),
);
deviceRouter.patch(
  "/:deviceId",
  validate(renameDeviceSchema),
  asyncHandler(deviceController.rename),
);
deviceRouter.delete("/:deviceId", asyncHandler(deviceController.revoke));
deviceRouter.post(
  "/me/prekeys",
  validate(replenishPreKeysSchema),
  asyncHandler(deviceController.replenishPreKeys),
);
deviceRouter.post(
  "/me/push-token",
  validate(setPushTokenSchema),
  asyncHandler(deviceController.setPushToken),
);
