import { MongoClient, type Collection, type Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;
let indexesReady = false;

export interface UserDocument {
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
  resetTokenHash?: string;
  resetTokenExpiresAt?: Date;
  /** Sessions issued before this are no longer accepted (auth/session.ts). */
  passwordChangedAt?: Date;
  /** The Inner Pause Pass (pass-store.ts): when the current one ends. */
  passExpiresAt?: Date;
  passActivatedAt?: Date;
}

export function getMongoUri() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }
  return uri;
}

export async function getDb(): Promise<Db> {
  if (db) return db;
  client = new MongoClient(getMongoUri());
  await client.connect();
  db = client.db();
  return db;
}

export async function usersCollection(): Promise<Collection<UserDocument>> {
  const database = await getDb();
  const users = database.collection<UserDocument>("users");
  if (!indexesReady) {
    await users.createIndex({ email: 1 }, { unique: true });
    indexesReady = true;
  }
  return users;
}

export async function pingMongo() {
  const database = await getDb();
  await database.command({ ping: 1 });
}
