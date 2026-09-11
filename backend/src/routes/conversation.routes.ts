import { Router } from "express";
import { conversationController } from "../controllers/conversation.controller";
import { messageController } from "../controllers/message.controller";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { messageRateLimiter } from "../middlewares/rateLimiters";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createConversationSchema,
  editMessageSchema,
  listMessagesSchema,
  markReadSchema,
  sendMessageSchema,
} from "../validators/conversation.validators";

export const conversationRouter = Router();
conversationRouter.use(requireAuth);

conversationRouter.get("/", asyncHandler(conversationController.list));
conversationRouter.post("/", validate(createConversationSchema), asyncHandler(conversationController.create));
conversationRouter.get("/:conversationId", asyncHandler(conversationController.detail));
conversationRouter.post("/:conversationId/leave", asyncHandler(conversationController.leave));
conversationRouter.post("/:conversationId/mute", asyncHandler(conversationController.mute));
conversationRouter.post("/:conversationId/members", asyncHandler(conversationController.addMembers));
conversationRouter.delete("/:conversationId/members/:userId", asyncHandler(conversationController.removeMember));

conversationRouter.get(
  "/:conversationId/messages",
  validate(listMessagesSchema),
  asyncHandler(messageController.list),
);
conversationRouter.post(
  "/:conversationId/messages",
  messageRateLimiter,
  validate(sendMessageSchema),
  asyncHandler(messageController.send),
);
conversationRouter.post(
  "/:conversationId/messages/read",
  validate(markReadSchema),
  asyncHandler(messageController.markRead),
);

export const messageRouter = Router();
messageRouter.use(requireAuth);
messageRouter.patch("/:messageId", validate(editMessageSchema), asyncHandler(messageController.edit));
messageRouter.delete("/:messageId", asyncHandler(messageController.remove));
