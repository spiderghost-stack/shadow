import { Request, Response } from "express";
import { messageService } from "../services/message.service";

export const messageController = {
  async send(req: Request, res: Response) {
    const message = await messageService.send({
      conversationId: req.params.conversationId,
      senderId: req.auth!.userId,
      senderDeviceId: req.auth!.deviceId,
      ...req.body,
    });
    res.status(201).json({ message });
  },

  async list(req: Request, res: Response) {
    const limit = req.query.limit ? Number(req.query.limit) : 30;
    const cursor = req.query.cursor as string | undefined;
    const messages = await messageService.listPage(req.params.conversationId, req.auth!.userId, limit, cursor);
    res.json({ messages });
  },

  async markRead(req: Request, res: Response) {
    const result = await messageService.markRead(
      req.params.conversationId,
      req.auth!.userId,
      req.body.messageIds,
    );
    res.json(result);
  },

  async edit(req: Request, res: Response) {
    const message = await messageService.edit(
      req.params.messageId,
      req.auth!.userId,
      req.body.encryptedPayload,
      req.body.nonce,
    );
    res.json({ message });
  },

  async remove(req: Request, res: Response) {
    const result = await messageService.deleteForAll(req.params.messageId, req.auth!.userId);
    res.json(result);
  },
};
