import {
  ApiError,
  type AuthSession,
  type GenerateAccepted,
  type GenerateResponse,
  type GenerateResult,
  type HealthResponse,
  type ImageGenerateBody,
  type Img2ImgGenerateBody,
  type JobRow,
  type MapGenerateBody,
  type ChatRequest,
  type ChatResponse,
  type TtsRequest,
  type TtsResponse,
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
      let errorMsg = text;
      if (text.toLowerCase().startsWith("<!doctype html") || text.toLowerCase().startsWith("<html")) {
        errorMsg = "An unexpected server error occurred.";
      } else if (text.length > 200) {
        errorMsg = text.slice(0, 200) + "...";
      }
      body = { error: errorMsg };
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

export async function signup(
  email: string,
  password: string,
): Promise<AuthSession> {
  const res = await fetch(`${baseUrl()}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseJson<AuthSession>(res);
}

export async function login(
  email: string,
  password: string,
): Promise<AuthSession> {
  const res = await fetch(`${baseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseJson<AuthSession>(res);
}

export async function logout(accessToken: string): Promise<void> {
  const res = await fetch(`${baseUrl()}/auth/signout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    // We don't throw an ApiError here so that failure to sign out
    // on the backend doesn't prevent local clearSession.
    console.error("Failed to sign out on server");
  }
}

export async function getMe(
  accessToken: string,
): Promise<{ user: { id: string; email: string | null }; credits?: number }> {
  const res = await fetch(`${baseUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  return parseJson(res);
}

export async function listJobs(
  accessToken: string,
  limit = 50,
): Promise<JobRow[]> {
  const res = await fetch(`${baseUrl()}/jobs?limit=${limit}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data = await parseJson<{ jobs: JobRow[] }>(res);
  return data.jobs;
}

export async function getJob(
  accessToken: string,
  id: string,
): Promise<JobRow> {
  const res = await fetch(`${baseUrl()}/jobs/${id}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  return parseJson<JobRow>(res);
}

export type PollOptions = {
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  onUpdate?: (job: JobRow) => void;
};

export async function pollJobUntilDone(
  accessToken: string,
  jobId: string,
  options: PollOptions = {},
): Promise<GenerateResult> {
  const intervalMs = options.intervalMs ?? 2000;
  const timeoutMs = options.timeoutMs ?? 20 * 60 * 1000;
  const started = Date.now();

  while (true) {
    if (options.signal?.aborted) {
      throw new Error("Polling cancelled");
    }
    if (Date.now() - started > timeoutMs) {
      throw new ApiError(408, {
        error: "Timed out waiting for job",
        jobId,
      });
    }

    const job = await getJob(accessToken, jobId);
    options.onUpdate?.(job);

    if (job.status === "succeeded") {
      if (!job.result_url) {
        throw new ApiError(500, {
          error: "Job succeeded but result_url is missing",
          jobId,
        });
      }
      return {
        id: job.id,
        type: job.type,
        status: "succeeded",
        url: job.result_url,
        seed: job.seed,
        inferenceMs: job.inference_ms,
      };
    }

    if (job.status === "failed") {
      throw new ApiError(500, {
        error: job.error || "Generation failed",
        jobId: job.id,
      });
    }

    await sleep(intervalMs, options.signal);
  }
}

export async function generateAndWait(
  accessToken: string,
  kind: "image" | "video" | "img2img",
  body: ImageGenerateBody | VideoGenerateBody | Img2ImgGenerateBody,
  options: PollOptions = {},
): Promise<GenerateResult> {
  const path =
    kind === "image"
      ? "/generate/image"
      : kind === "video"
        ? "/generate/video"
        : "/generate/img2img";
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: options.signal,
  });

  const data = await parseJson<GenerateResponse>(res);

  if (data.status === "succeeded") {
    return data;
  }

  const accepted = data as GenerateAccepted;
  options.onUpdate?.({
    id: accepted.id,
    user_id: "",
    type: accepted.type,
    status: "running",
    prompt: "",
    result_url: null,
    seed: null,
    inference_ms: null,
    error: null,
    created_at: new Date().toISOString(),
  });

  return pollJobUntilDone(accessToken, accepted.id, options);
}

export async function generateImage(
  accessToken: string,
  body: ImageGenerateBody,
  options?: PollOptions,
): Promise<GenerateResult> {
  return generateAndWait(accessToken, "image", body, options);
}

export async function generateVideo(
  accessToken: string,
  body: VideoGenerateBody,
  options?: PollOptions,
): Promise<GenerateResult> {
  return generateAndWait(accessToken, "video", body, options);
}

export async function generateImg2Img(
  accessToken: string,
  body: Img2ImgGenerateBody,
  options?: PollOptions,
): Promise<GenerateResult> {
  return generateAndWait(accessToken, "img2img", body, options);
}

export async function sendChatMessage(
  accessToken: string,
  request: ChatRequest,
): Promise<ChatResponse> {
  const res = await fetch(`${baseUrl()}/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  return parseJson<ChatResponse>(res);
}

export async function generateTts(
  accessToken: string,
  body: TtsRequest,
): Promise<TtsResponse> {
  const res = await fetch(`${baseUrl()}/tts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return parseJson<TtsResponse>(res);
}

export async function generateMap(
  accessToken: string,
  body: MapGenerateBody,
  options: PollOptions = {},
): Promise<GenerateResult> {
  const res = await fetch(`${baseUrl()}/generate/map`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: options.signal,
  });

  const data = await parseJson<GenerateResponse>(res);

  if (data.status === "succeeded") {
    return data;
  }

  const accepted = data as GenerateAccepted;
  options.onUpdate?.({
    id: accepted.id,
    user_id: "",
    type: "map",
    status: "running",
    prompt: "",
    result_url: null,
    seed: null,
    inference_ms: null,
    error: null,
    created_at: new Date().toISOString(),
  });

  return pollJobUntilDone(accessToken, accepted.id, options);
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Polling cancelled"));
      return;
    }
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new Error("Polling cancelled"));
      },
      { once: true },
    );
  });
}
