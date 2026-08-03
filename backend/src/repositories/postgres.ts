import pg from "pg";
import { Signer } from "@aws-sdk/rds-signer";
import type { AudioRecord, EmotionalInsight, JournalDetail, JournalSummary, NotificationMessage } from "@innerpause/shared";
import { forbidden, notFound } from "../shared/errors.js";
import type { AppRepository, CreateAudioInput, CreateJournalInput, UserPreferences } from "./types.js";

const { Pool } = pg;

export interface PostgresRepositoryOptions {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
  iamAuth?: boolean;
  region?: string;
}

export class PostgresRepository implements AppRepository {
  private readonly pool: pg.Pool;

  constructor(options: PostgresRepositoryOptions) {
    this.pool = new Pool({
      connectionString: options.connectionString,
      host: options.host,
      port: options.port,
      database: options.database,
      user: options.user,
      password: options.iamAuth ? createIamPasswordProvider(options) : options.password,
      ssl: options.ssl ? { rejectUnauthorized: true } : undefined,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  async ensureUser(input: { providerSubject: string; email: string; fullName?: string }) {
    const result = await this.pool.query<{ id: string; email: string; full_name: string | null }>(
      `
        insert into public.profiles (auth_provider, auth_provider_subject, email, full_name)
        values ('cognito', $1, $2, $3)
        on conflict (auth_provider_subject)
        do update set email = excluded.email, full_name = coalesce(excluded.full_name, public.profiles.full_name), updated_at = now()
        returning id, email, full_name
      `,
      [input.providerSubject, input.email, input.fullName ?? null],
    );
    const row = result.rows[0];
    return { id: row.id, email: row.email, fullName: row.full_name ?? undefined };
  }

  async createJournal(userId: string, input: CreateJournalInput): Promise<JournalDetail> {
    const result = await this.pool.query(
      `
        insert into public.journal_entries (user_id, title, raw_text, transcription, save_mode, is_temporary, emotional_intensity_before)
        values ($1, $2, $3, $4, 'journal_and_analysis', false, $5)
        returning id, title, raw_text, transcription, emotional_intensity_before, created_at, updated_at
      `,
      [userId, input.title, input.rawText, input.transcription ?? null, input.emotionalIntensityBefore ?? null],
    );
    return mapJournalDetail(result.rows[0], false, false);
  }

  async listJournals(userId: string): Promise<JournalSummary[]> {
    const result = await this.pool.query(
      `
        select j.id, j.title, j.emotional_intensity_before, j.created_at, j.updated_at,
          exists(select 1 from public.emotional_analyses a where a.journal_entry_id = j.id and a.user_id = $1) as has_analysis,
          exists(select 1 from public.audio_records ar where ar.journal_entry_id = j.id and ar.user_id = $1 and ar.deleted_at is null) as has_reset_audio
        from public.journal_entries j
        where j.user_id = $1
        order by j.created_at desc
      `,
      [userId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      emotionalIntensityBefore: row.emotional_intensity_before ?? undefined,
      hasAnalysis: row.has_analysis,
      hasResetAudio: row.has_reset_audio,
    }));
  }

  async getJournalForUser(userId: string, journalId: string): Promise<JournalDetail> {
    const result = await this.pool.query(
      `
        select j.id, j.user_id, j.title, j.raw_text, j.transcription, j.emotional_intensity_before, j.created_at, j.updated_at,
          exists(select 1 from public.emotional_analyses a where a.journal_entry_id = j.id and a.user_id = $1) as has_analysis,
          exists(select 1 from public.audio_records ar where ar.journal_entry_id = j.id and ar.user_id = $1 and ar.deleted_at is null) as has_reset_audio,
          a.summary as analysis_summary,
          a.emotions_json as analysis_emotions,
          a.triggers_json as analysis_triggers,
          a.suggested_outcome as analysis_suggested_outcome,
          a.recommended_duration as analysis_recommended_duration,
          a.safety_flag as analysis_safety_flag
        from public.journal_entries j
        left join lateral (
          select summary, emotions_json, triggers_json, suggested_outcome, recommended_duration, safety_flag
          from public.emotional_analyses
          where user_id = $1 and journal_entry_id = j.id
          order by created_at desc
          limit 1
        ) a on true
        where j.id = $2
      `,
      [userId, journalId],
    );
    const row = result.rows[0];
    if (!row) throw notFound("Journal");
    if (row.user_id !== userId) throw forbidden();
    return mapJournalDetail(row, row.has_analysis, row.has_reset_audio);
  }

  async deleteJournalForUser(userId: string, journalId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const found = await client.query("select user_id from public.journal_entries where id = $1 for update", [journalId]);
      if (!found.rows[0]) throw notFound("Journal");
      if (found.rows[0].user_id !== userId) throw forbidden();
      await client.query("delete from public.journal_entries where id = $1 and user_id = $2", [journalId, userId]);
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async rememberJob(idempotencyKey: string | undefined, userId: string, jobId: string): Promise<void> {
    if (!idempotencyKey) return;
    await this.pool.query("update public.jobs set idempotency_key = $1 where id = $2 and user_id = $3", [idempotencyKey, jobId, userId]);
  }

  async findJobByIdempotency(idempotencyKey: string | undefined, userId: string) {
    if (!idempotencyKey) return null;
    const result = await this.pool.query("select id from public.jobs where user_id = $1 and idempotency_key = $2", [userId, idempotencyKey]);
    return result.rows[0] ? { userId, jobId: result.rows[0].id } : null;
  }

  async createJob(input: { userId: string; type: "journal_analysis" | "reset_audio"; status: string; journalId?: string; idempotencyKey?: string }) {
    const result = await this.pool.query(
      `
        insert into public.jobs (user_id, journal_entry_id, job_type, status, idempotency_key)
        values ($1, $2, $3, $4, $5)
        on conflict (user_id, idempotency_key) where idempotency_key is not null
        do update set updated_at = public.jobs.updated_at
        returning id
      `,
      [input.userId, input.journalId ?? null, input.type, input.status, input.idempotencyKey ?? null],
    );
    return { jobId: result.rows[0].id };
  }

  async updateJob(input: { userId: string; jobId: string; status: string; resultId?: string; errorMessage?: string }) {
    await this.pool.query(
      "update public.jobs set status = $1, result_id = $2, error_message = $3, updated_at = now() where id = $4 and user_id = $5",
      [input.status, input.resultId ?? null, input.errorMessage ?? null, input.jobId, input.userId],
    );
  }

  async getJobForUser(userId: string, jobId: string) {
    const result = await this.pool.query("select id, job_type, status, result_id, error_message from public.jobs where id = $1 and user_id = $2", [
      jobId,
      userId,
    ]);
    const row = result.rows[0];
    if (!row) throw notFound("Job");
    return {
      jobId: row.id,
      type: row.job_type,
      status: row.status,
      resultId: row.result_id ?? undefined,
      errorMessage: row.error_message ?? undefined,
    };
  }

  async saveAnalysis(userId: string, journalId: string, insight: EmotionalInsight, modelVersion?: string) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const journal = await client.query("select user_id from public.journal_entries where id = $1 for update", [journalId]);
      if (!journal.rows[0]) throw notFound("Journal");
      if (journal.rows[0].user_id !== userId) throw forbidden();
      const result = await client.query(
        `
          insert into public.emotional_analyses (
            user_id,
            journal_entry_id,
            summary,
            incidents_json,
            emotions_json,
            triggers_json,
            chakra_analysis_json,
            suggested_outcome,
            recommended_duration,
            safety_flag,
            model_version
          )
          values ($1, $2, $3, '[]', $4, $5, '[]', $6, $7, $8, $9)
          returning id
        `,
        [
          userId,
          journalId,
          insight.summary,
          JSON.stringify(insight.emotions),
          JSON.stringify(insight.triggers),
          insight.suggestedOutcome ?? null,
          insight.recommendedDuration ?? null,
          insight.safetyFlag,
          modelVersion ?? null,
        ],
      );
      await client.query("commit");
      return { analysisId: result.rows[0].id };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async createAudio(userId: string, input: CreateAudioInput): Promise<AudioRecord> {
    const result = await this.pool.query(
      `
        insert into public.audio_records (user_id, journal_entry_id, title, duration_seconds, object_key, mime_type, size_bytes)
        values ($1, $2, $3, $4, $5, $6, $7)
        returning id, journal_entry_id, title, duration_seconds
      `,
      [userId, input.journalId ?? null, input.title, input.durationSeconds, input.objectKey ?? null, input.mimeType ?? null, input.sizeBytes ?? null],
    );
    const row = result.rows[0];
    return {
      id: row.id,
      journalId: row.journal_entry_id ?? undefined,
      title: row.title,
      durationSeconds: row.duration_seconds,
      playbackUrl: input.playbackUrl,
      expiresAt: input.expiresAt,
    };
  }

  async getAudioForUser(userId: string, audioId: string): Promise<AudioRecord & { objectKey?: string }> {
    const result = await this.pool.query(
      "select id, user_id, journal_entry_id, title, duration_seconds, object_key from public.audio_records where id = $1 and deleted_at is null",
      [audioId],
    );
    const row = result.rows[0];
    if (!row) throw notFound("Audio");
    if (row.user_id !== userId) throw forbidden();
    return {
      id: row.id,
      journalId: row.journal_entry_id ?? undefined,
      title: row.title,
      durationSeconds: row.duration_seconds,
      objectKey: row.object_key ?? undefined,
      playbackUrl: "",
      expiresAt: "",
    };
  }

  async deleteAudioForUser(userId: string, audioId: string): Promise<void> {
    const result = await this.pool.query("update public.audio_records set deleted_at = now() where id = $1 and user_id = $2 and deleted_at is null", [
      audioId,
      userId,
    ]);
    if (result.rowCount === 0) throw notFound("Audio");
  }

  async getPreferences(userId: string): Promise<UserPreferences> {
    const result = await this.pool.query(
      `
        select timezone, onboarding_completed, preferred_session_duration, preferred_voice, preferred_music_style,
          preferred_guidance_level, affirmations_enabled, nature_sounds_enabled
        from public.profiles
        where id = $1
      `,
      [userId],
    );
    const row = result.rows[0];
    if (!row) throw notFound("Profile");
    return mapPreferences(row);
  }

  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const current = await this.getPreferences(userId);
    const next = { ...current, ...preferences };
    const result = await this.pool.query(
      `
        update public.profiles
        set timezone = $2,
          onboarding_completed = $3,
          preferred_session_duration = $4,
          preferred_voice = $5,
          preferred_music_style = $6,
          preferred_guidance_level = $7,
          affirmations_enabled = $8,
          nature_sounds_enabled = $9,
          updated_at = now()
        where id = $1
        returning timezone, onboarding_completed, preferred_session_duration, preferred_voice, preferred_music_style,
          preferred_guidance_level, affirmations_enabled, nature_sounds_enabled
      `,
      [
        userId,
        next.timezone ?? "UTC",
        next.onboardingCompleted ?? false,
        next.preferredSessionDuration ?? 20,
        next.preferredVoice ?? "Soft guide",
        next.preferredMusicStyle ?? "Cosmic ambient",
        next.preferredGuidanceLevel ?? "Balanced",
        next.affirmationsEnabled ?? true,
        next.natureSoundsEnabled ?? false,
      ],
    );
    return mapPreferences(result.rows[0]);
  }

  async listNotifications(userId: string): Promise<NotificationMessage[]> {
    const result = await this.pool.query(
      "select id, message_text, delivery_channel, delivery_status, created_at from public.notification_messages where user_id = $1 order by created_at desc",
      [userId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      messageText: row.message_text,
      deliveryChannel: row.delivery_channel,
      deliveryStatus: row.delivery_status,
      createdAt: row.created_at.toISOString(),
    }));
  }

  async createNotification(input: {
    userId: string;
    messageText: string;
    deliveryChannel: NotificationMessage["deliveryChannel"];
    deliveryStatus: NotificationMessage["deliveryStatus"];
    idempotencyKey?: string;
    scheduledFor?: string;
    providerMessageId?: string;
    errorMessage?: string;
  }): Promise<NotificationMessage> {
    const result = await this.pool.query(
      `
        insert into public.notification_messages (
          user_id, idempotency_key, message_text, scheduled_for, delivery_channel, delivery_status, provider_message_id, error_message
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8)
        on conflict (user_id, idempotency_key) where idempotency_key is not null
        do update set updated_at = public.notification_messages.updated_at
        returning id, message_text, delivery_channel, delivery_status, created_at
      `,
      [
        input.userId,
        input.idempotencyKey ?? null,
        input.messageText,
        input.scheduledFor ?? null,
        input.deliveryChannel,
        input.deliveryStatus,
        input.providerMessageId ?? null,
        input.errorMessage ?? null,
      ],
    );
    const row = result.rows[0];
    return {
      id: row.id,
      messageText: row.message_text,
      deliveryChannel: row.delivery_channel,
      deliveryStatus: row.delivery_status,
      createdAt: row.created_at.toISOString(),
    };
  }
}

function createIamPasswordProvider(options: PostgresRepositoryOptions) {
  if (!options.host || !options.user || !options.region) throw new Error("RDS IAM auth requires host, user and region.");
  const signer = new Signer({
    hostname: options.host,
    port: options.port ?? 5432,
    username: options.user,
    region: options.region,
  });
  return () => signer.getAuthToken();
}

function mapJournalDetail(row: pg.QueryResultRow, hasAnalysis: boolean, hasResetAudio: boolean): JournalDetail {
  const detail: JournalDetail = {
    id: row.id,
    title: row.title,
    rawText: row.raw_text,
    transcription: row.transcription ?? undefined,
    emotionalIntensityBefore: row.emotional_intensity_before ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    hasAnalysis,
    hasResetAudio,
  };
  if (row.analysis_summary) {
    detail.analysis = {
      summary: row.analysis_summary,
      emotions: Array.isArray(row.analysis_emotions) ? row.analysis_emotions : [],
      triggers: Array.isArray(row.analysis_triggers) ? row.analysis_triggers : [],
      suggestedOutcome: row.analysis_suggested_outcome ?? undefined,
      recommendedDuration: row.analysis_recommended_duration ?? undefined,
      safetyFlag: Boolean(row.analysis_safety_flag),
    };
  }
  return detail;
}

function mapPreferences(row: pg.QueryResultRow): UserPreferences {
  return {
    timezone: row.timezone ?? undefined,
    onboardingCompleted: row.onboarding_completed ?? undefined,
    preferredSessionDuration: row.preferred_session_duration ?? undefined,
    preferredVoice: row.preferred_voice ?? undefined,
    preferredMusicStyle: row.preferred_music_style ?? undefined,
    preferredGuidanceLevel: row.preferred_guidance_level ?? undefined,
    affirmationsEnabled: row.affirmations_enabled ?? undefined,
    natureSoundsEnabled: row.nature_sounds_enabled ?? undefined,
  };
}
