export type JobType = "image" | "video";
export type JobStatus = "running" | "succeeded" | "failed";

export type HealthResponse = {
  ok: boolean;
  gpu?: {
    ok?: boolean;
    pipe?: boolean;
    video_pipe?: boolean;
    device?: string;
    port?: number;
    mock?: boolean;
  };
};

export type ImageGenerateBody = {
  prompt: string;
  negative_prompt?: string | null;
  steps?: number;
  seed?: number | null;
  width?: number;
  height?: number;
  guidance_scale?: number;
};

export type VideoGenerateBody = {
  prompt: string;
  negative_prompt?: string | null;
  steps?: number;
  fps?: number;
  seed?: number | null;
};

export type GenerateAccepted = {
  id: string;
  type: JobType;
  status: "running";
};

export type GenerateSucceeded = {
  id: string;
  type: JobType;
  status: "succeeded";
  url: string;
  seed: string | null;
  inferenceMs: number | null;
};

export type GenerateResult = GenerateSucceeded;
export type GenerateResponse = GenerateAccepted | GenerateSucceeded;

export type JobRow = {
  id: string;
  user_id: string;
  type: JobType;
  status: JobStatus;
  prompt: string;
  result_url: string | null;
  seed: string | null;
  inference_ms: number | null;
  error: string | null;
  created_at: string;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string; email: string | null };
};

export type ApiErrorBody = {
  error: string;
  jobId?: string;
  details?: unknown;
};

export class ApiError extends Error {
  status: number;
  jobId?: string;
  details?: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error || "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.jobId = body.jobId;
    this.details = body.details;
  }
}
