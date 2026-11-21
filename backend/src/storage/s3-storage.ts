import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { validationError } from "../shared/errors.js";

const allowedMimeTypes = new Set(["audio/mpeg", "audio/mp3", "audio/wav", "audio/mp4", "image/png", "image/jpeg", "image/webp"]);
const allowedExtensions = new Set(["mp3", "wav", "m4a", "png", "jpg", "jpeg", "webp"]);
const maxFileBytes = 25 * 1024 * 1024;

export class S3PrivateStorage {
  private readonly client: S3Client;

  constructor(
    private readonly input: {
      region: string;
      bucketName: string;
    },
  ) {
    this.client = new S3Client({ region: input.region });
  }

  createUserObjectKey(userId: string, extension: string) {
    const safeExtension = extension.toLowerCase().replace(/^\./, "");
    if (!allowedExtensions.has(safeExtension)) throw validationError("Unsupported file extension.");
    return `users/${userId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${safeExtension}`;
  }

  validateFile(input: { mimeType: string; sizeBytes: number; extension: string }) {
    if (!allowedMimeTypes.has(input.mimeType)) throw validationError("Unsupported file type.");
    if (input.sizeBytes > maxFileBytes) throw validationError("File is too large.");
    if (!allowedExtensions.has(input.extension.toLowerCase().replace(/^\./, ""))) throw validationError("Unsupported file extension.");
  }

  async signedUploadUrl(input: { objectKey: string; mimeType: string; sizeBytes: number; expiresInSeconds?: number }) {
    this.validateFile({ mimeType: input.mimeType, sizeBytes: input.sizeBytes, extension: input.objectKey.split(".").at(-1) ?? "" });
    const command = new PutObjectCommand({
      Bucket: this.input.bucketName,
      Key: input.objectKey,
      ContentType: input.mimeType,
      Metadata: { private: "true" },
    });
    return getSignedUrl(this.client, command, { expiresIn: input.expiresInSeconds ?? 300 });
  }

  async uploadPrivateObject(input: { objectKey: string; bytes: Uint8Array; mimeType: string }) {
    this.validateFile({ mimeType: input.mimeType, sizeBytes: input.bytes.byteLength, extension: input.objectKey.split(".").at(-1) ?? "" });
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.input.bucketName,
        Key: input.objectKey,
        Body: input.bytes,
        ContentType: input.mimeType,
        Metadata: { private: "true" },
      }),
    );
  }

  async signedDownloadUrl(objectKey: string, expiresInSeconds = 300) {
    const command = new GetObjectCommand({ Bucket: this.input.bucketName, Key: objectKey });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async deleteObject(objectKey: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.input.bucketName, Key: objectKey }));
  }
}
