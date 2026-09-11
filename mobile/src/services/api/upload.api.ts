import { api, API_BASE_URL } from "./client";

export interface UploadResult {
  storageUrl: string;
  sizeBytes: number;
  checksumSha256: string;
}

// `fileUri` pointe vers un fichier LOCAL déjà chiffré (voir
// crypto/attachmentFlow.ts) — jamais le fichier original en clair.
export async function uploadEncryptedFile(fileUri: string, mimeType = "application/octet-stream"): Promise<UploadResult> {
  const form = new FormData();
  // @ts-expect-error — type FormData React Native (uri/name/type), différent du DOM
  form.append("file", { uri: fileUri, name: "blob.enc", type: mimeType });

  const { data } = await api.post<UploadResult>("/uploads", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export function resolveUploadUrl(storageUrl: string): string {
  return storageUrl.startsWith("http") ? storageUrl : `${API_BASE_URL}${storageUrl}`;
}
