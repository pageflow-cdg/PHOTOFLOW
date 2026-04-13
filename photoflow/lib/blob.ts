import { put, del } from "@vercel/blob";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      "Formato não suportado. Use JPG, PNG, WebP ou HEIC."
    );
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Arquivo muito grande. Máximo 10MB.");
  }
}

export async function uploadToBlob(file: File, folder: string = "fotos") {
  validateFile(file);
  const filename = `${folder}/${Date.now()}-${file.name}`;
  const blob = await put(filename, file, {
    access: "public",
  });
  return blob.url;
}

export async function deleteFromBlob(url: string) {
  await del(url);
}
