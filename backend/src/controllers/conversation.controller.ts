import { Request, Response } from "express";
import { conversationService } from "../services/conversation.service";

export const conversationController = {
  async create(req: Request, res: Response) {
    const { type, name, memberIds } = req.body;
    const conversation =
      type === "direct"
        ? await conversationService.createDirect(req.auth!.userId, memberIds[0])
        : await conversationService.createGroup(req.auth!.userId, name, memberIds);
    res.status(201).json({ conversation });
  },

  async list(req: Request, res: Response) {
    const conversations = await conversationService.listMine(req.auth!.userId);
    res.json({ conversations });
  },

  async detail(req: Request, res: Response) {
    const conversation = await conversationService.getDetail(req.params.conversationId, req.auth!.userId);
    res.json({ conversation });
  },

  async leave(req: Request, res: Response) {
    const result = await conversationService.leave(req.params.conversationId, req.auth!.userId);
    res.json(result);
  },

  async mute(req: Request, res: Response) {
    const mutedUntil = req.body.mutedUntil ? new Date(req.body.mutedUntil) : null;
    const result = await conversationService.mute(req.params.conversationId, req.auth!.userId, mutedUntil);
    res.json(result);
  },

  async addMembers(req: Request, res: Response) {
    const result = await conversationService.addMembers(req.params.conversationId, req.auth!.userId, req.body.userIds);
    res.json(result);
  },

  async removeMember(req: Request, res: Response) {
    const result = await conversationService.removeMember(req.params.conversationId, req.auth!.userId, req.params.userId);
    res.json(result);
  },
};
