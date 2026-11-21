import type { CreateJournalRequest } from "@innerpause/shared";
import { validateCreateJournal } from "../validation/journal.js";
import type { AppRepository } from "../repositories/types.js";

export class JournalService {
  constructor(private readonly repository: AppRepository) {}

  async create(userId: string, input: CreateJournalRequest) {
    const body = validateCreateJournal(input);
    return this.repository.createJournal(userId, body);
  }

  async list(userId: string) {
    return this.repository.listJournals(userId);
  }

  async get(userId: string, journalId: string) {
    return this.repository.getJournalForUser(userId, journalId);
  }

  async delete(userId: string, journalId: string) {
    await this.repository.deleteJournalForUser(userId, journalId);
    return { deleted: true as const };
  }
}
