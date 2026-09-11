import { Request, Response } from "express";
import { deviceService } from "../services/device.service";
import { AppError } from "../utils/AppError";

export const deviceController = {
  async list(req: Request, res: Response) {
    const devices = await deviceService.listMyDevices(req.auth!.userId);
    res.json({ devices });
  },

  async getBundle(req: Request, res: Response) {
    const bundle = await deviceService.getPublicBundle(req.params.deviceId);
    res.json({ bundle });
  },

  async rename(req: Request, res: Response) {
    const device = await deviceService.rename(req.auth!.userId, req.params.deviceId, req.body.deviceName);
    res.json({ device });
  },

  async revoke(req: Request, res: Response) {
    if (req.params.deviceId === req.auth!.deviceId) {
      throw AppError.badRequest("Vous ne pouvez pas révoquer l'appareil que vous utilisez actuellement.");
    }
    const result = await deviceService.revoke(req.auth!.userId, req.params.deviceId);
    res.json(result);
  },

  async replenishPreKeys(req: Request, res: Response) {
    const result = await deviceService.replenishPreKeys(req.auth!.deviceId, req.body.keys);
    res.json(result);
  },

  async setPushToken(req: Request, res: Response) {
    const result = await deviceService.setPushToken(req.auth!.deviceId, req.body.pushToken);
    res.json(result);
  },
};
