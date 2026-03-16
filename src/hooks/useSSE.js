import { useEffect, useRef, useCallback } from "react";
import { createEventSource } from "../api";

/**
 * Subscribe to server-sent events.
 *
 * @param {function} onEvent  - Called with { type, payload, ts } for every event
 * @param {boolean}  enabled  - Set false to pause (e.g. when user is not logged in)
 */
export default function useSSE(onEvent, enabled = true) {
  const esRef = useRef(null);
  const handlerRef = useRef(onEvent);

  // Keep handler ref fresh without recreating the SSE connection
  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  const connect = useCallback(() => {
    if (esRef.current) esRef.current.close();
    esRef.current = createEventSource((event) => {
      if (event.type !== "connected") handlerRef.current?.(event);
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    connect();

    // Reconnect on visibility change (tab comes back)
    const onVisible = () => {
      if (document.visibilityState === "visible") connect();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      esRef.current?.close();
    };
  }, [enabled, connect]);
}
