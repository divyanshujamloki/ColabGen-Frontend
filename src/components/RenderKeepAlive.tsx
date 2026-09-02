"use client";

import { useEffect, useRef } from "react";

export function RenderKeepAlive() {
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const pingBackend = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!apiUrl) return;
        
        await fetch(`${apiUrl}/health`, {
          method: "GET",
          cache: "no-store",
        });
        
        console.log(`[KeepAlive] Pinged backend at ${new Date().toLocaleTimeString()}`);
      } catch (error) {
        console.warn("[KeepAlive] Ping failed:", error);
      }
    };

    const scheduleNextPing = () => {
      const minMs = 10 * 60 * 1000;
      const maxMs = 14 * 60 * 1000;
      const randomDelay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
      
      intervalRef.current = setTimeout(() => {
        pingBackend();
        scheduleNextPing();
      }, randomDelay);
    };

    pingBackend();
    scheduleNextPing();

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, []);

  return null;
}
