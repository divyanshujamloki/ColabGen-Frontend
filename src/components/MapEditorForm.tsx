"use client";

import { FormEvent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { generateMap } from "@/lib/api/client";
import {
  ApiError,
  type GenerateResult,
  type MapPath,
  type MapPin,
} from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/session";

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground outline-none ring-accent focus:ring-2 disabled:opacity-60";

const MAP_BG =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/1280px-World_map_-_low_resolution.svg.png";

type DragMode =
  | { kind: "pin"; id: string }
  | { kind: "caption"; id: string }
  | null;

function newId(): string {
  return `pin_${Math.random().toString(36).slice(2, 9)}`;
}

function xyToLatLng(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): { lat: number; lng: number } {
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  return {
    lng: Math.max(-180, Math.min(180, x * 360 - 180)),
    lat: Math.max(-90, Math.min(90, 90 - y * 180)),
  };
}

function project(lat: number, lng: number): { x: number; y: number } {
  return {
    x: ((lng + 180) / 360) * 100,
    y: ((90 - lat) / 180) * 100,
  };
}

function pathStroke(style: MapPath["style"]): {
  color: string;
  dash?: string;
  width: number;
} {
  if (style === "dashed") return { color: "#facc15", dash: "2 1.4", width: 0.7 };
  if (style === "solid") return { color: "#60a5fa", width: 0.9 };
  return { color: "#fb923c", width: 0.75 };
}

function arrowPoints(
  a: { x: number; y: number },
  b: { x: number; y: number },
): string {
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const size = 2.2;
  const left = {
    x: b.x - Math.cos(angle - 0.45) * size,
    y: b.y - Math.sin(angle - 0.45) * size,
  };
  const right = {
    x: b.x - Math.cos(angle + 0.45) * size,
    y: b.y - Math.sin(angle + 0.45) * size,
  };
  return `${b.x},${b.y} ${left.x},${left.y} ${right.x},${right.y}`;
}

export function MapEditorForm() {
  const mapRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const dragRef = useRef<DragMode>(null);
  const didDragRef = useRef(false);
  const pinsRef = useRef<MapPin[]>([]);

  const [pins, setPins] = useState<MapPin[]>([]);
  const [paths, setPaths] = useState<MapPath[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [linkFromId, setLinkFromId] = useState<string | null>(null);
  const [duration, setDuration] = useState(10);
  const [pathStyle, setPathStyle] = useState<"arrow" | "dashed" | "solid">(
    "arrow",
  );
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);

  pinsRef.current = pins;

  const selected = useMemo(
    () => pins.find((p) => p.id === selectedId) ?? null,
    [pins, selectedId],
  );

  useEffect(() => {
    function onMove(e: globalThis.MouseEvent) {
      const mode = dragRef.current;
      if (!mode || !mapRef.current) return;
      didDragRef.current = true;
      const rect = mapRef.current.getBoundingClientRect();
      if (mode.kind === "pin") {
        const { lat, lng } = xyToLatLng(e.clientX, e.clientY, rect);
        setPins((prev) =>
          prev.map((p) =>
            p.id === mode.id
              ? {
                  ...p,
                  lat: Math.round(lat * 1000) / 1000,
                  lng: Math.round(lng * 1000) / 1000,
                }
              : p,
          ),
        );
      } else {
        const pin = pinsRef.current.find((p) => p.id === mode.id);
        if (!pin) return;
        const pos = project(pin.lat, pin.lng);
        const mx = ((e.clientX - rect.left) / rect.width) * 100;
        const my = ((e.clientY - rect.top) / rect.height) * 100;
        const ox = Math.max(-40, Math.min(40, mx - pos.x));
        const oy = Math.max(-40, Math.min(40, my - pos.y));
        setPins((prev) =>
          prev.map((p) =>
            p.id === mode.id
              ? {
                  ...p,
                  captionOffsetX: Math.round(ox * 10) / 10,
                  captionOffsetY: Math.round(oy * 10) / 10,
                }
              : p,
          ),
        );
      }
    }
    function onUp() {
      dragRef.current = null;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  function onMapClick(e: MouseEvent<HTMLDivElement>) {
    if (!mapRef.current) return;
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if ((e.target as HTMLElement).closest("[data-pin],[data-caption]")) return;

    const rect = mapRef.current.getBoundingClientRect();
    const { lat, lng } = xyToLatLng(e.clientX, e.clientY, rect);
    const id = newId();
    const pin: MapPin = {
      id,
      lat: Math.round(lat * 1000) / 1000,
      lng: Math.round(lng * 1000) / 1000,
      label: `Stop ${pins.length + 1}`,
      caption: "",
      captionOffsetX: 0,
      captionOffsetY: 10,
    };
    setPins((prev) => [...prev, pin]);
    setSelectedId(id);
    setError(null);
  }

  function updateSelected(patch: Partial<MapPin>) {
    if (!selectedId) return;
    setPins((prev) =>
      prev.map((p) => (p.id === selectedId ? { ...p, ...patch } : p)),
    );
  }

  function removeSelected() {
    if (!selectedId) return;
    setPins((prev) => prev.filter((p) => p.id !== selectedId));
    setPaths((prev) =>
      prev.filter((p) => p.from !== selectedId && p.to !== selectedId),
    );
    setSelectedId(null);
    if (linkFromId === selectedId) setLinkFromId(null);
  }

  function onPinMouseDown(id: string, e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    didDragRef.current = false;
    dragRef.current = { kind: "pin", id };
    setSelectedId(id);
  }

  function onPinClick(id: string, e: MouseEvent) {
    e.stopPropagation();
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (linkFromId) {
      if (linkFromId !== id) {
        setPaths((prev) => [
          ...prev,
          { from: linkFromId, to: id, style: pathStyle },
        ]);
      }
      setLinkFromId(null);
      setSelectedId(id);
      return;
    }
    setSelectedId(id);
  }

  function onCaptionMouseDown(id: string, e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    didDragRef.current = false;
    dragRef.current = { kind: "caption", id };
    setSelectedId(id);
  }

  function autoConnect() {
    if (pins.length < 2) return;
    const next: MapPath[] = [];
    for (let i = 0; i < pins.length - 1; i++) {
      next.push({ from: pins[i].id, to: pins[i + 1].id, style: pathStyle });
    }
    setPaths(next);
  }

  function changePathStyle(style: "arrow" | "dashed" | "solid") {
    setPathStyle(style);
    setPaths((prev) => prev.map((p) => ({ ...p, style })));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (pins.length < 2) {
      setError("Add at least two pins on the map.");
      return;
    }

    const effectivePaths =
      paths.length > 0
        ? paths
        : pins.slice(0, -1).map((p, i) => ({
            from: p.id,
            to: pins[i + 1].id,
            style: pathStyle as MapPath["style"],
          }));

    setLoading(true);
    setStatusText("Rendering map video…");
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const accessToken = getAccessToken();
      if (!accessToken) throw new Error("Not signed in");

      const data = await generateMap(
        accessToken,
        {
          pins: pins.map((p) => ({
            ...p,
            caption: p.caption?.trim() || undefined,
            captionOffsetX: p.captionOffsetX ?? 0,
            captionOffsetY: p.captionOffsetY ?? 10,
          })),
          paths: effectivePaths,
          style: { duration, fps: 24, mapStyle: "streets" },
        },
        {
          signal: ac.signal,
          onUpdate: (job) => {
            setStatusText(
              job.status === "running"
                ? "Rendering… this can take about a minute"
                : `Job ${job.status}`,
            );
          },
        },
      );
      setResult(data);
      setStatusText(null);
    } catch (err) {
      if (err instanceof ApiError) {
        let message = err.message;
        if (err.status === 400 && err.details) {
          const details = err.details as {
            fieldErrors?: Record<string, string[]>;
          };
          const fields = details.fieldErrors
            ? Object.entries(details.fieldErrors)
                .map(([k, v]) => `${k}: ${v.join(", ")}`)
                .join("; ")
            : "";
          if (fields) message = fields;
        }
        setError(message);
      } else if (err instanceof Error && err.message === "Polling cancelled") {
        setStatusText("Cancelled");
      } else {
        setError(err instanceof Error ? err.message : "Request failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div
          ref={mapRef}
          role="application"
          aria-label="World map editor"
          onClick={onMapClick}
          className="relative aspect-[2/1] w-full cursor-crosshair overflow-hidden rounded-lg border border-border bg-[#0b1d36] shadow-[inset_0_0_60px_rgba(0,0,0,0.35)]"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(12,18,24,0.25), rgba(12,18,24,0.45)), url(${MAP_BG})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <marker
                id="arrowHead"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L6,3 L0,6 Z" fill="#fb923c" />
              </marker>
            </defs>
            {paths.map((path, i) => {
              const from = pins.find((p) => p.id === path.from);
              const to = pins.find((p) => p.id === path.to);
              if (!from || !to) return null;
              const a = project(from.lat, from.lng);
              const b = project(to.lat, to.lng);
              const style = path.style ?? pathStyle;
              const stroke = pathStroke(style);
              return (
                <g key={`${path.from}-${path.to}-${i}`}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={stroke.color}
                    strokeWidth={stroke.width}
                    strokeDasharray={stroke.dash}
                    vectorEffect="non-scaling-stroke"
                  />
                  {style === "arrow" ? (
                    <polygon
                      points={arrowPoints(a, b)}
                      fill={stroke.color}
                    />
                  ) : null}
                </g>
              );
            })}
          </svg>

          {pins.map((pin, index) => {
            const pos = project(pin.lat, pin.lng);
            const active = pin.id === selectedId;
            const linking = pin.id === linkFromId;
            const capX = pos.x + (pin.captionOffsetX ?? 0);
            const capY = pos.y + (pin.captionOffsetY ?? 10);
            const caption = pin.caption?.trim();
            return (
              <div key={pin.id}>
                <button
                  type="button"
                  data-pin
                  onMouseDown={(e) => onPinMouseDown(pin.id, e)}
                  onClick={(e) => onPinClick(pin.id, e)}
                  className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 active:cursor-grabbing ${
                    active || linking
                      ? "border-white bg-accent scale-110"
                      : "border-accent/80 bg-accent/90 hover:scale-105"
                  }`}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    width: 16,
                    height: 16,
                  }}
                  title={`${pin.label} (drag to move)`}
                >
                  <span className="sr-only">{pin.label}</span>
                </button>
                <span
                  className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded bg-black/75 px-1.5 py-0.5 text-[10px] text-foreground"
                  style={{ left: `${pos.x}%`, top: `calc(${pos.y}% + 12px)` }}
                >
                  {index + 1}. {pin.label}
                </span>
                {caption ? (
                  <button
                    type="button"
                    data-caption
                    onMouseDown={(e) => onCaptionMouseDown(pin.id, e)}
                    className={`absolute z-30 max-w-[12rem] -translate-x-1/2 cursor-grab rounded-md border px-2 py-1 text-left text-[11px] leading-snug shadow-md active:cursor-grabbing ${
                      active
                        ? "border-accent bg-[#0f1c28] text-foreground"
                        : "border-border/80 bg-black/80 text-foreground"
                    }`}
                    style={{ left: `${capX}%`, top: `${capY}%` }}
                    title="Drag caption"
                  >
                    <span className="mb-0.5 block text-[9px] uppercase tracking-wide text-accent">
                      Caption
                    </span>
                    {caption}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted">
          Click to add pins. Drag pins to move them. Enter a caption, then drag
          the caption bubble. Path style updates the lines on the map.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!selectedId || loading}
            onClick={() => setLinkFromId(selectedId)}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition hover:bg-surface-soft disabled:opacity-50"
          >
            {linkFromId ? "Click target pin…" : "Link next"}
          </button>
          <button
            type="button"
            disabled={pins.length < 2 || loading}
            onClick={autoConnect}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition hover:bg-surface-soft disabled:opacity-50"
          >
            Auto-connect
          </button>
          <button
            type="button"
            disabled={!selectedId || loading}
            onClick={removeSelected}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-danger transition hover:bg-surface-soft disabled:opacity-50"
          >
            Remove pin
          </button>
          <button
            type="button"
            disabled={loading || (pins.length === 0 && paths.length === 0)}
            onClick={() => {
              setPins([]);
              setPaths([]);
              setSelectedId(null);
              setLinkFromId(null);
              setResult(null);
            }}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted transition hover:bg-surface-soft disabled:opacity-50"
          >
            Clear
          </button>
        </div>

        {selected ? (
          <div className="space-y-3 rounded-lg border border-border bg-surface/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Selected pin
            </p>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">Label</span>
              <input
                className={inputClass}
                value={selected.label}
                maxLength={50}
                onChange={(e) => updateSelected({ label: e.target.value })}
                disabled={loading}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">Caption</span>
              <input
                className={inputClass}
                value={selected.caption ?? ""}
                maxLength={200}
                placeholder="Appears on the map — drag to place"
                onChange={(e) => updateSelected({ caption: e.target.value })}
                disabled={loading}
              />
            </label>
            <p className="font-mono text-xs text-muted">
              {selected.lat.toFixed(3)}, {selected.lng.toFixed(3)}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted">
            Click the map to place your first stop.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Duration (sec)</span>
            <input
              type="number"
              min={5}
              max={60}
              className={inputClass}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 10)}
              disabled={loading}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Path style</span>
            <select
              className={inputClass}
              value={pathStyle}
              onChange={(e) =>
                changePathStyle(
                  e.target.value as "arrow" | "dashed" | "solid",
                )
              }
              disabled={loading}
            >
              <option value="arrow">Arrow (orange)</option>
              <option value="solid">Solid (blue)</option>
              <option value="dashed">Dashed (yellow)</option>
            </select>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || pins.length < 2}
            className="rounded-md bg-accent px-4 py-2 font-medium text-[#0c1218] transition hover:bg-accent-dim disabled:opacity-50"
          >
            {loading ? "Rendering…" : "Render video"}
          </button>
          {loading ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="text-sm text-muted hover:text-foreground"
            >
              Cancel
            </button>
          ) : null}
        </div>

        {statusText ? (
          <p className="text-sm text-muted" aria-live="polite">
            {statusText}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        {result?.url ? (
          <div className="overflow-hidden rounded-lg border border-border bg-black/40">
            <video
              key={result.url}
              src={result.url}
              controls
              autoPlay
              className="aspect-video w-full bg-black"
            />
            <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-muted">
              <span>
                {result.inferenceMs != null
                  ? `Rendered in ${Math.round(result.inferenceMs / 1000)}s`
                  : "Ready"}
              </span>
              <a
                href={result.url}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                Open / download
              </a>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
