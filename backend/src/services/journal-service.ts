import type { CreateJournalRequest } from "@innerpause/shared";
import { validateCreateJournal } from "../validation/journal.js";
import type { InMemoryRepository } from "../repositories/in-memory.js";

export class JournalService {
  constructor(private readonly repository: InMemoryRepository) {}

  create(userId: string, input: CreateJournalRequest) {
    const body = validateCreateJournal(input);
    return this.repository.createJournal(userId, body);
  }

  list(userId: string) {
    return this.repository.listJournals(userId);
  }

  get(userId: string, journalId: string) {
    return this.repository.getJournalForUser(userId, journalId);
  }

  delete(userId: string, journalId: string) {
    this.repository.deleteJournalForUser(userId, journalId);
    return { deleted: true as const };
  }
}

