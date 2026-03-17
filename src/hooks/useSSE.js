import { useEffect, useRef, useCallback } from 'react';
import { createEventSource } from '../api';

const BASE_DELAY  = 1000;   // 1 s initial retry delay
const MAX_DELAY   = 30000;  // 30 s maximum retry delay
const BACKOFF_MUL = 2;

/**
 * Subscribe to server-sent events with automatic exponential-backoff reconnection.
 * On error the hook waits BASE_DELAY, then doubles on each subsequent failure up to MAX_DELAY.
 * Resets the delay after any successful message, and on tab-focus visibility change.
 *
 * @param {function} onEvent  - Called with { type, payload, ts } for every event
 * @param {boolean}  enabled  - Set false to pause (e.g. when user is not logged in)
 */
export default function useSSE(onEvent, enabled = true) {
  const esRef      = useRef(null);
  const handlerRef = useRef(onEvent);
  const retryRef   = useRef(null);
  const delayRef   = useRef(BASE_DELAY);
  const mountedRef = useRef(true);

  useEffect(() => { handlerRef.current = onEvent; }, [onEvent]);

  const cleanup = useCallback(() => {
    clearTimeout(retryRef.current);
    if (esRef.current) {
      esRef.current.onmessage = null;
      esRef.current.onerror   = null;
      esRef.current.close();
      esRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    cleanup();

    const es = createEventSource((event) => {
      if (event.type !== 'connected') handlerRef.current?.(event);
      // Successful message — reset backoff
      delayRef.current = BASE_DELAY;
    });

    es.onerror = () => {
      es.close();
      if (!mountedRef.current) return;
      const delay = delayRef.current;
      delayRef.current = Math.min(delay * BACKOFF_MUL, MAX_DELAY);
      retryRef.current = setTimeout(connect, delay);
    };

    esRef.current = es;
  }, [cleanup]);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) { cleanup(); return; }

    connect();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        delayRef.current = BASE_DELAY;
        connect();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      mountedRef.current = false;
      document.removeEventListener('visibilitychange', onVisible);
      cleanup();
    };
  }, [enabled, connect, cleanup]);
}