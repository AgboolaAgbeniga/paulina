import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || "gram-media";
const publicUrl = process.env.R2_PUBLIC_URL || "";

// Initialize S3 client configured for Cloudflare R2
export const r2Client = (accessKeyId && secretAccessKey && accountId)
  ? new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    })
  : null;

/**
 * Uploads a file buffer/blob to Cloudflare R2.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  if (!r2Client) {
    throw new Error("R2 client not configured. Please check your R2 environment variables (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).");
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await r2Client.send(command);

    // Build public access URL
    if (publicUrl) {
      return `${publicUrl.replace(/\/$/, "")}/${key}`;
    }
    return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;
  } catch (err) {
    console.error("R2 Upload failed:", err);
    throw err;
  }
}

/**
 * Resolve public access URL of an asset key
 */
export function getPublicUrl(key: string): string {
  if (publicUrl) {
    return `${publicUrl.replace(/\/$/, "")}/${key}`;
  }
  if (accountId) {
    return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;
  }
  throw new Error("R2 client not configured.");
}
