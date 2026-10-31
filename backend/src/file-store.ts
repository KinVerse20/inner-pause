import { randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { copyFile, mkdir, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

// Where uploaded sounds, covers and rendered files live, by key: an
// original is "<id>.mp3", a rendering "renders/<key>.m4a".
//
// With S3_BUCKET set, files go to that S3 bucket (or any S3-compatible
// store, such as Cloudflare R2 or MinIO, via S3_ENDPOINT), so redeploying
// or replacing the server never loses them. Otherwise they stay on this
// server's disk under backend/uploads — fine for development or a server
// with a permanent disk.
//
// S3 settings: S3_BUCKET, S3_REGION (default ap-south-1, Mumbai),
// S3_PREFIX (default "inner-pause/"), and for non-AWS stores S3_ENDPOINT
// and S3_FORCE_PATH_STYLE=true. Credentials come from AWS's usual sources
// (an IAM role on AWS, or AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY), or
// S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY.

export interface FileStore {
  kind: "local" | "s3";
  write(key: string, body: Buffer, contentType: string): Promise<void>;
  /** Stores a finished local file under `key`, consuming (removing) the local file. */
  writeFromPath(key: string, path: string, contentType: string): Promise<void>;
  /** The file's size in bytes, or null if there is no such file. */
  size(key: string): Promise<number | null>;
  /** The file's bytes, or the inclusive byte range given. */
  read(key: string, range?: { start: number; end: number }): Promise<ReadableStream>;
  /** A path on this server to read the file from (ffmpeg needs one); release() when done. */
  localCopy(key: string): Promise<{ path: string; release: () => Promise<void> }>;
  remove(key: string): Promise<void>;
  /** Every key under `prefix`, e.g. "renders/". */
  list(prefix: string): Promise<string[]>;
}

export const UPLOAD_DIR = resolve(fileURLToPath(new URL("../uploads", import.meta.url)));
/** Scratch space for renders; contents can be deleted whenever nothing is rendering. */
export const TEMP_DIR = join(tmpdir(), "inner-pause");

// On Windows a file can't be deleted while another process (ffmpeg) has it
// open, so retry briefly; a file that stays locked is logged, not fatal.
export async function removeLocalFile(path: string) {
  try {
    await rm(path, { force: true, maxRetries: 10, retryDelay: 200 });
  } catch (error) {
    console.error(`[files] couldn't remove ${path}:`, error instanceof Error ? error.message : error);
  }
}

function localStore(root: string): FileStore {
  const pathOf = (key: string) => join(root, ...key.split("/"));
  return {
    kind: "local",
    async write(key, body) {
      await mkdir(dirname(pathOf(key)), { recursive: true });
      await writeFile(pathOf(key), body);
    },
    async writeFromPath(key, path) {
      await mkdir(dirname(pathOf(key)), { recursive: true });
      try {
        await rename(path, pathOf(key));
      } catch {
        // A different drive than the temp folder: copy instead.
        await copyFile(path, pathOf(key));
        await removeLocalFile(path);
      }
    },
    async size(key) {
      try {
        return (await stat(pathOf(key))).size;
      } catch {
        return null;
      }
    },
    async read(key, range) {
      const stream = createReadStream(pathOf(key), range ? { start: range.start, end: range.end } : undefined);
      return Readable.toWeb(stream) as ReadableStream;
    },
    async localCopy(key) {
      return { path: pathOf(key), release: async () => {} };
    },
    async remove(key) {
      await removeLocalFile(pathOf(key));
    },
    async list(prefix) {
      try {
        return (await readdir(pathOf(prefix.replace(/\/$/, "")))).map((name) => `${prefix}${name}`);
      } catch {
        return [];
      }
    },
  };
}

const isNotFound = (error: unknown) => {
  const e = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return e?.name === "NotFound" || e?.name === "NoSuchKey" || e?.$metadata?.httpStatusCode === 404;
};

function s3Store(bucket: string): FileStore {
  const prefix = process.env.S3_PREFIX ?? "inner-pause/";
  const keyOf = (key: string) => `${prefix}${key}`;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const client = new S3Client({
    region: process.env.S3_REGION ?? process.env.AWS_REGION ?? "ap-south-1",
    endpoint: process.env.S3_ENDPOINT?.trim() || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: accessKeyId ? { accessKeyId, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "" } : undefined,
  });
  return {
    kind: "s3",
    async write(key, body, contentType) {
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: keyOf(key), Body: body, ContentType: contentType }));
    },
    async writeFromPath(key, path, contentType) {
      const { size } = await stat(path);
      await client.send(
        new PutObjectCommand({ Bucket: bucket, Key: keyOf(key), Body: createReadStream(path), ContentLength: size, ContentType: contentType }),
      );
      await removeLocalFile(path);
    },
    async size(key) {
      try {
        const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: keyOf(key) }));
        return head.ContentLength ?? null;
      } catch (error) {
        if (isNotFound(error)) return null;
        throw error;
      }
    },
    async read(key, range) {
      const object = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: keyOf(key), Range: range ? `bytes=${range.start}-${range.end}` : undefined }),
      );
      if (!object.Body) throw new Error(`Empty object: ${key}`);
      return object.Body.transformToWebStream() as ReadableStream;
    },
    async localCopy(key) {
      await mkdir(TEMP_DIR, { recursive: true });
      const path = join(TEMP_DIR, `${randomUUID()}-${basename(key)}`);
      const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: keyOf(key) }));
      if (!object.Body) throw new Error(`Empty object: ${key}`);
      await pipeline(object.Body as Readable, createWriteStream(path));
      return { path, release: () => removeLocalFile(path) };
    },
    async remove(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: keyOf(key) }));
    },
    async list(listPrefix) {
      const keys: string[] = [];
      let token: string | undefined;
      do {
        const page = await client.send(
          new ListObjectsV2Command({ Bucket: bucket, Prefix: keyOf(listPrefix), ContinuationToken: token }),
        );
        for (const item of page.Contents ?? []) if (item.Key) keys.push(item.Key.slice(prefix.length));
        token = page.IsTruncated ? page.NextContinuationToken : undefined;
      } while (token);
      return keys;
    },
  };
}

let store: FileStore | null = null;

/** The configured store, created on first use (after the environment is loaded). */
export function fileStore(): FileStore {
  if (!store) {
    const bucket = process.env.S3_BUCKET?.trim();
    store = bucket ? s3Store(bucket) : localStore(UPLOAD_DIR);
    console.log(bucket ? `[files] storing sounds in S3 bucket ${bucket}` : `[files] storing sounds on this server's disk (${UPLOAD_DIR})`);
  }
  return store;
}
