import { Request, Response } from "express";
import { userService } from "../services/user.service";
import { securityEventRepository } from "../repositories/securityEvent.repository";
import { deviceRepository } from "../repositories/device.repository";

export const userController = {
  async me(req: Request, res: Response) {
    const user = await userService.getProfile(req.auth!.userId);
    res.json({ user });
  },

  async getById(req: Request, res: Response) {
    const user = await userService.getProfile(req.params.userId);
    res.json({ user });
  },

  async primaryDevice(req: Request, res: Response) {
    const device = await deviceRepository.findPrimaryActiveDevice(req.params.userId);
    if (!device) {
      res.status(404).json({ error: { code: "NO_ACTIVE_DEVICE", message: "Aucun appareil actif pour cet utilisateur." } });
      return;
    }
    res.json({ deviceId: device.id });
  },

  async search(req: Request, res: Response) {
    const users = await userService.search(String(req.query.q), req.auth!.userId);
    res.json({ users });
  },

  async updateProfile(req: Request, res: Response) {
    const user = await userService.updateProfile(req.auth!.userId, req.body);
    res.json({ user });
  },

  async updatePrivacy(req: Request, res: Response) {
    const user = await userService.updatePrivacy(req.auth!.userId, req.body);
    res.json({ user });
  },

  async changePassword(req: Request, res: Response) {
    const result = await userService.changePassword(
      req.auth!.userId,
      req.body.currentPassword,
      req.body.newPassword,
    );
    res.json(result);
  },

  async securityEvents(req: Request, res: Response) {
    const events = await securityEventRepository.listForUser(req.auth!.userId);
    res.json({ events });
  },
};
