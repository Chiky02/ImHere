"use client";

import { useEffect, useRef } from "react";

/** Refresh once when the user comes back to the tab. No interval. */
export function useOnVisible(callback: () => void | Promise<void>) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) return;
      void cbRef.current();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, []);
}

export function usePushEvents(
  handler: (data: { type?: string; puntoId?: string; url?: string }) => void,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMsg = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;
      handlerRef.current(event.data as { type?: string; puntoId?: string; url?: string });
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, []);
}
