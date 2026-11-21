import type { ErrorCode } from "@innerpause/shared";

export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(status: number, code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const unauthenticated = () => new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
export const forbidden = () => new AppError(403, "FORBIDDEN", "You do not have access to this resource.");
export const notFound = (resource = "Resource") => new AppError(404, "NOT_FOUND", `${resource} was not found.`);
export const validationError = (message: string, details?: Record<string, unknown>) =>
  new AppError(400, "VALIDATION_ERROR", message, details);
export const duplicateRequest = (jobId: string) =>
  new AppError(409, "DUPLICATE_REQUEST", "This request is already being processed.", { jobId });

