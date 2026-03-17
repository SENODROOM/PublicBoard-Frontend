import { renderHook, act } from '@testing-library/react';
import useSSE from '../../hooks/useSSE';

// Mock createEventSource from api.js
jest.mock('../../api', () => ({
  createEventSource: jest.fn(),
}));

const { createEventSource } = require('../../api');

function makeFakeES() {
  const es = {
    onmessage: null,
    onerror:   null,
    close:     jest.fn(),
  };
  return es;
}

beforeEach(() => {
  jest.useFakeTimers();
  createEventSource.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useSSE', () => {
  it('calls createEventSource when enabled', () => {
    const es = makeFakeES();
    createEventSource.mockReturnValue(es);

    renderHook(() => useSSE(jest.fn(), true));

    expect(createEventSource).toHaveBeenCalledTimes(1);
  });

  it('does NOT call createEventSource when disabled', () => {
    renderHook(() => useSSE(jest.fn(), false));
    expect(createEventSource).not.toHaveBeenCalled();
  });

  it('closes the EventSource on unmount', () => {
    const es = makeFakeES();
    createEventSource.mockReturnValue(es);

    const { unmount } = renderHook(() => useSSE(jest.fn(), true));
    unmount();

    expect(es.close).toHaveBeenCalled();
  });

  it('forwards messages to the onEvent handler', () => {
    const es = makeFakeES();
    createEventSource.mockImplementation((cb) => {
      es._cb = cb;
      return es;
    });

    const onEvent = jest.fn();
    renderHook(() => useSSE(onEvent, true));

    act(() => {
      es._cb({ type: 'issue.created', payload: { id: '1' }, ts: Date.now() });
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'issue.created' })
    );
  });

  it('does NOT forward the initial "connected" event', () => {
    const es = makeFakeES();
    createEventSource.mockImplementation((cb) => {
      es._cb = cb;
      return es;
    });

    const onEvent = jest.fn();
    renderHook(() => useSSE(onEvent, true));

    act(() => {
      es._cb({ type: 'connected', id: 123 });
    });

    expect(onEvent).not.toHaveBeenCalled();
  });

  it('schedules a reconnect after an error (backoff)', () => {
    const es = makeFakeES();
    createEventSource.mockReturnValue(es);

    renderHook(() => useSSE(jest.fn(), true));
    expect(createEventSource).toHaveBeenCalledTimes(1);

    // Simulate error
    act(() => {
      es.onerror?.();
    });

    // Before 1 second — no reconnect yet
    expect(createEventSource).toHaveBeenCalledTimes(1);

    // After BASE_DELAY (1000ms) — reconnect fires
    const es2 = makeFakeES();
    createEventSource.mockReturnValue(es2);

    act(() => { jest.advanceTimersByTime(1000); });
    expect(createEventSource).toHaveBeenCalledTimes(2);
  });

  it('doubles the retry delay on repeated errors (exponential backoff)', () => {
    const es1 = makeFakeES();
    createEventSource.mockReturnValue(es1);

    renderHook(() => useSSE(jest.fn(), true));

    // First error → retry after 1000ms
    act(() => { es1.onerror?.(); });

    const es2 = makeFakeES();
    createEventSource.mockReturnValue(es2);
    act(() => { jest.advanceTimersByTime(1000); });
    expect(createEventSource).toHaveBeenCalledTimes(2);

    // Second error → retry after 2000ms
    act(() => { es2.onerror?.(); });

    act(() => { jest.advanceTimersByTime(1500); }); // not enough
    expect(createEventSource).toHaveBeenCalledTimes(2); // still 2

    const es3 = makeFakeES();
    createEventSource.mockReturnValue(es3);
    act(() => { jest.advanceTimersByTime(600); }); // total 2100ms > 2000ms
    expect(createEventSource).toHaveBeenCalledTimes(3);
  });

  it('stops reconnecting after unmount even if timer fires', () => {
    const es = makeFakeES();
    createEventSource.mockReturnValue(es);

    const { unmount } = renderHook(() => useSSE(jest.fn(), true));

    act(() => { es.onerror?.(); });
    unmount();

    const es2 = makeFakeES();
    createEventSource.mockReturnValue(es2);

    // Timer fires — but hook is unmounted, should NOT reconnect
    act(() => { jest.advanceTimersByTime(2000); });
    expect(createEventSource).toHaveBeenCalledTimes(1);
  });
});
