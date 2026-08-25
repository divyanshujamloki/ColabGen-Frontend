import {
  ApiError,
  type GenerateResult,
  type HealthResponse,
  type ImageGenerateBody,
  type JobRow,
  type VideoGenerateBody,
} from "./types";

function baseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  }
  return url.replace(/\/$/, "");
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: unknown = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: text };
    }
  }
  if (!res.ok) {
    const err = body as { error?: string; jobId?: string; details?: unknown };
    throw new ApiError(res.status, {
      error: err.error ?? res.statusText,
      jobId: err.jobId,
      details: err.details,
    });
  }
  return body as T;
}

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${baseUrl()}/health`, {
    method: "GET",
    cache: "no-store",
  });
  return parseJson<HealthResponse>(res);
}

export async function generateImage(
  accessToken: string,
  body: ImageGenerateBody,
): Promise<GenerateResult> {
  const res = await fetch(`${baseUrl()}/generate/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return parseJson<GenerateResult>(res);
}

export async function generateVideo(
  accessToken: string,
  body: VideoGenerateBody,
): Promise<GenerateResult> {
  const res = await fetch(`${baseUrl()}/generate/video`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return parseJson<GenerateResult>(res);
}

export async function getJob(
  accessToken: string,
  id: string,
): Promise<JobRow> {
  const res = await fetch(`${baseUrl()}/jobs/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
  return parseJson<JobRow>(res);
}
