import { ObjectId } from "mongodb";

import { hashResetToken } from "./session";
import { usersCollection, type UserDocument } from "../mongo";

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
}

export function toPublicUser(id: string, user: UserDocument): PublicUser {
  return {
    id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function findUserByEmail(email: string) {
  const users = await usersCollection();
  return users.findOne({ email: normalizeEmail(email) });
}

export async function findUserById(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const users = await usersCollection();
  return users.findOne({ _id: new ObjectId(id) });
}

export async function createUser(input: { email: string; passwordHash: string; fullName: string }) {
  const users = await usersCollection();
  const now = new Date();
  const doc: UserDocument = {
    email: normalizeEmail(input.email),
    passwordHash: input.passwordHash,
    fullName: input.fullName.trim(),
    phone: "",
    createdAt: now,
    updatedAt: now,
  };
  const result = await users.insertOne(doc);
  return { id: result.insertedId.toString(), user: doc };
}

export async function updateUserProfile(id: string, input: { fullName?: string; phone?: string }) {
  if (!ObjectId.isValid(id)) return null;
  const users = await usersCollection();
  const next: Partial<UserDocument> = { updatedAt: new Date() };
  if (typeof input.fullName === "string") next.fullName = input.fullName.trim().slice(0, 80);
  if (typeof input.phone === "string") next.phone = input.phone.trim().slice(0, 30);
  await users.updateOne({ _id: new ObjectId(id) }, { $set: next });
  return findUserById(id);
}

export async function deleteUser(id: string) {
  if (!ObjectId.isValid(id)) return;
  await (await usersCollection()).deleteOne({ _id: new ObjectId(id) });
}

export async function updateUserPassword(id: string, passwordHash: string) {
  if (!ObjectId.isValid(id)) return;
  const users = await usersCollection();
  await users.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: { passwordHash, passwordChangedAt: new Date(), updatedAt: new Date() },
      $unset: { resetTokenHash: "", resetTokenExpiresAt: "" },
    },
  );
}

export async function setResetToken(email: string, token: string, expiresAt: Date) {
  const users = await usersCollection();
  await users.updateOne(
    { email: normalizeEmail(email) },
    {
      $set: {
        resetTokenHash: hashResetToken(token),
        resetTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      },
    },
  );
}

export async function findUserByResetToken(token: string) {
  const users = await usersCollection();
  return users.findOne({
    resetTokenHash: hashResetToken(token),
    resetTokenExpiresAt: { $gt: new Date() },
  });
}
