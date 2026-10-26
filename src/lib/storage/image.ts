import { createHash, randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/avif"];

export type StoredImage = { url: string; width: number; height: number };

export interface ImageStorage {
  put(data: Buffer, name: string): Promise<string>;
}

/** Stockage local dans public/uploads : pour le développement ou un VPS avec volume persistant. */
class LocalImageStorage implements ImageStorage {
  async put(data: Buffer, name: string) {
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), data);
    return `/uploads/${name}`;
  }
}

/** Cloudinary : upload signé via l'API REST (pas de SDK). */
class CloudinaryImageStorage implements ImageStorage {
  constructor(
    private cloud: string,
    private key: string,
    private secret: string,
  ) {}
  async put(data: Buffer, name: string) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const publicId = `boutique/${name.replace(/\.webp$/, "")}`;
    const signature = createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${this.secret}`).digest("hex");
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(data)], { type: "image/webp" }));
    form.append("api_key", this.key);
    form.append("timestamp", timestamp);
    form.append("public_id", publicId);
    form.append("signature", signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${this.cloud}/image/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error(`Cloudinary ${res.status}`);
    return ((await res.json()) as { secure_url: string }).secure_url;
  }
}

/** Vercel Blob : BLOB_READ_WRITE_TOKEN est ajouté automatiquement quand le stockage Blob est relié au projet Vercel. */
class VercelBlobImageStorage implements ImageStorage {
  async put(data: Buffer, name: string) {
    const blob = await put(`produits/${name}`, data, { access: "public", contentType: "image/webp", addRandomSuffix: false });
    return blob.url;
  }
}

export function getImageStorage(): ImageStorage {
  if (process.env.IMAGE_STORAGE === "vercel-blob" || (!process.env.IMAGE_STORAGE && process.env.BLOB_READ_WRITE_TOKEN)) return new VercelBlobImageStorage();
  const { IMAGE_STORAGE, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (IMAGE_STORAGE === "cloudinary" && CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)
    return new CloudinaryImageStorage(CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET);
  return new LocalImageStorage();
}

/** Valide, compresse (WebP, 1600 px max, orientation corrigée) et stocke une photo envoyée depuis le téléphone. */
export async function processAndStoreImage(file: File): Promise<StoredImage> {
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Format d'image non accepté (JPEG, PNG, WebP).");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Image trop lourde (8 Mo maximum).");
  const input = Buffer.from(await file.arrayBuffer());
  const { data, info } = await sharp(input, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer({ resolveWithObject: true });
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.webp`;
  const url = await getImageStorage().put(data, name);
  return { url, width: info.width, height: info.height };
}
