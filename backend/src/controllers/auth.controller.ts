import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { sha256 } from "../utils/hash";

function deviceContext(req: Request) {
  return {
    userAgent: req.headers["user-agent"],
    ipAddressHash: req.ip ? sha256(req.ip) : undefined,
  };
}

function serializeUser(user: { id: string; username: string; displayName: string; avatarUrl: string | null }) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  };
}

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body, deviceContext(req));
    res.status(201).json({
      user: serializeUser(result.user),
      deviceId: result.device.id,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body, deviceContext(req));
    res.status(200).json({
      user: serializeUser(result.user),
      deviceId: result.device.id,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  },

  async refresh(req: Request, res: Response) {
    const result = await authService.refresh(req.body.refreshToken);
    res.status(200).json(result);
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.body.refreshToken);
    res.status(204).send();
  },
};
