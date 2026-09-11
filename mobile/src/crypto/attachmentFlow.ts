import * as FileSystem from "expo-file-system";
import { b64 } from "./encoding";
import { encryptAttachment, decryptAttachment } from "./message";
import { uploadEncryptedFile, resolveUploadUrl } from "../services/api/upload.api";

export interface AttachmentDescriptor {
  fileType: "image" | "file" | "voice";
  mimeType?: string;
  sizeBytes: number;
  storageUrl: string;
  encryptionNonce: string;
  checksumSha256?: string;
}

// Prend un fichier LOCAL en clair (ex. photo choisie dans la galerie),
// le chiffre entièrement sur l'appareil, écrit le résultat chiffré dans un
// fichier temporaire, puis l'upload. Le fichier en clair ne quitte jamais
// l'appareil ; seul le blob chiffré part vers le serveur.
export async function encryptAndUploadFile(params: {
  localUri: string;
  mimeType: string;
  fileType: AttachmentDescriptor["fileType"];
  sharedKey: Uint8Array;
}): Promise<AttachmentDescriptor> {
  const base64Plain = await FileSystem.readAsStringAsync(params.localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const plainBytes = b64.decode(base64Plain);

  const { encryptedData, nonce } = encryptAttachment(plainBytes, params.sharedKey);

  const tmpPath = `${FileSystem.cacheDirectory}shadow-upload-${Date.now()}.enc`;
  await FileSystem.writeAsStringAsync(tmpPath, b64.encode(encryptedData), {
    encoding: FileSystem.EncodingType.Base64,
  });

  const result = await uploadEncryptedFile(tmpPath, "application/octet-stream");
  await FileSystem.deleteAsync(tmpPath, { idempotent: true });

  return {
    fileType: params.fileType,
    mimeType: params.mimeType,
    sizeBytes: result.sizeBytes,
    storageUrl: result.storageUrl,
    encryptionNonce: nonce,
    checksumSha256: result.checksumSha256,
  };
}

// Télécharge un blob chiffré et le déchiffre localement, écrit le résultat
// en clair dans le cache local (jamais renvoyé au serveur), retourne l'URI
// locale utilisable directement dans un composant <Image>.
export async function downloadAndDecryptAttachment(params: {
  storageUrl: string;
  encryptionNonce: string;
  sharedKey: Uint8Array;
  suggestedExt?: string;
}): Promise<string> {
  const remoteUrl = resolveUploadUrl(params.storageUrl);
  const downloadPath = `${FileSystem.cacheDirectory}shadow-download-${Date.now()}.enc`;
  await FileSystem.downloadAsync(remoteUrl, downloadPath);

  const base64Encrypted = await FileSystem.readAsStringAsync(downloadPath, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const encryptedBytes = b64.decode(base64Encrypted);
  const plainBytes = decryptAttachment(encryptedBytes, params.encryptionNonce, params.sharedKey);

  const outPath = `${FileSystem.cacheDirectory}shadow-plain-${Date.now()}.${params.suggestedExt ?? "bin"}`;
  await FileSystem.writeAsStringAsync(outPath, b64.encode(plainBytes), {
    encoding: FileSystem.EncodingType.Base64,
  });
  await FileSystem.deleteAsync(downloadPath, { idempotent: true });

  return outPath;
}
