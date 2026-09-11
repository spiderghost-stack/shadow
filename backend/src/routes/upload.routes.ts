import { Router, Request, Response } from "express";
import multer from "multer";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import fs from "node:fs";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

// Le serveur ne reçoit et ne stocke QUE des blobs déjà chiffrés côté client
// (voir mobile/src/crypto/message.ts -> encryptAttachment). Il ne les
// déchiffre jamais, ne les inspecte jamais, ne les scanne jamais.

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, _file, cb) => cb(null, randomUUID()),
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 Mo, cohérent avec les limites pièces jointes du cahier des charges
});

export const uploadRouter = Router();
uploadRouter.use(requireAuth);

uploadRouter.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw AppError.badRequest("Aucun fichier reçu.");

    const checksumSha256 = await new Promise<string>((resolve, reject) => {
      const hash = createHash("sha256");
      const stream = fs.createReadStream(req.file!.path);
      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", reject);
    });

    res.status(201).json({
      storageUrl: `/uploads/${req.file.filename}`,
      sizeBytes: req.file.size,
      checksumSha256,
    });
  }),
);
