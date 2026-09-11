import { Router, Request, Response } from "express";
import { blockRepository, reportRepository } from "../repositories/block.repository";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { blockUserSchema, reportUserSchema } from "../validators/moderation.validators";
import { AppError } from "../utils/AppError";

const moderationController = {
  async block(req: Request, res: Response) {
    if (req.params.userId === req.auth!.userId) {
      throw AppError.badRequest("Impossible de vous bloquer vous-même.");
    }
    await blockRepository.block(req.auth!.userId, req.params.userId);
    res.status(204).send();
  },

  async unblock(req: Request, res: Response) {
    await blockRepository.unblock(req.auth!.userId, req.params.userId);
    res.status(204).send();
  },

  async listBlocked(req: Request, res: Response) {
    const blocks = await blockRepository.listBlockedByMe(req.auth!.userId);
    res.json({ blocks });
  },

  async report(req: Request, res: Response) {
    const report = await reportRepository.create({
      reporterId: req.auth!.userId,
      reportedId: req.params.userId,
      reason: req.body.reason,
      description: req.body.description,
    });
    res.status(201).json({ report });
  },
};

export const moderationRouter = Router();
moderationRouter.use(requireAuth);

moderationRouter.get("/blocks", asyncHandler(moderationController.listBlocked));
moderationRouter.post("/blocks/:userId", validate(blockUserSchema), asyncHandler(moderationController.block));
moderationRouter.delete("/blocks/:userId", asyncHandler(moderationController.unblock));
moderationRouter.post(
  "/reports/:userId",
  validate(reportUserSchema),
  asyncHandler(moderationController.report),
);
