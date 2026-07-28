'use client';
import { useSyncExternalStore, useCallback } from 'react';
import { Patient } from '@/lib/types';

const ACTIVE_ONLY = 'active';
const ALL = 'all';

interface StoreState {
  cache: Patient[];
  loading: boolean;
  error: string | null;
  lastSig: string;
  lastFetch: number;
}

const stores: Record<string, StoreState> = {
  [ALL]: { cache: [], loading: true, error: null, lastSig: '', lastFetch: 0 },
  [ACTIVE_ONLY]: { cache: [], loading: true, error: null, lastSig: '', lastFetch: 0 },
};

const inflight: Record<string, Promise<void> | null> = {
  [ALL]: null,
  [ACTIVE_ONLY]: null,
};

const listeners = new Set<() => void>();
let es: EventSource | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

function signatureOf(list: Patient[]): string {
  let s = list.length.toString(36) + '|';
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    s += p.id + ':' + p.status + ':' + (p.assignedRoom ?? '') + ':' +
      (p.estimatedWaitMinutes ?? '') + ':' + (p.calledTime ?? '') + ':' +
      (p.completedTime ?? '') + ';';
  }
  return s;
}

function endpointFor(kind: string): string {
  return kind === ACTIVE_ONLY ? '/api/patients?active=true' : '/api/patients';
}

async function fetchOnce(kind: string): Promise<void> {
  const now = Date.now();
  const state = stores[kind];
  if (now - state.lastFetch < 2000) return;
  state.lastFetch = now;

  if (inflight[kind]) {
    await inflight[kind];
    return;
  }

  const thisFetch = Date.now();
  inflight[kind] = fetch(endpointFor(kind), { cache: 'no-store' })
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<Patient[]>;
    })
    .then((data) => {
      state.loading = false;
      state.error = null;
      const sig = signatureOf(data);
      if (sig !== state.lastSig) {
        state.lastSig = sig;
        state.cache = data;
        emit();
      }
    })
    .catch(() => {
      state.error = 'Connection lost';
      state.loading = false;
      emit();
    })
    .finally(() => {
      inflight[kind] = null;
    });
  return inflight[kind];
}

function emit() {
  listeners.forEach((l) => l());
}

function scheduleDebouncedFetch() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    fetchOnce(ACTIVE_ONLY).catch(() => {});
    fetchOnce(ALL).catch(() => {});
  }, 500);
}

function ensureStream() {
  if (es || typeof window === 'undefined') return;
  es = new EventSource('/api/events');
  es.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'patients' || msg.type === 'stats' || msg.type === 'connected') {
        scheduleDebouncedFetch();
      }
    } catch {
      /* ignore malformed */
    }
  };
  es.onerror = () => {
    if (es) {
      es.close();
      es = null;
    }
    if (listeners.size > 0) {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        if (listeners.size > 0 && !es) ensureStream();
        fetchOnce(ACTIVE_ONLY).catch(() => {});
        fetchOnce(ALL).catch(() => {});
      }, 3000);
    }
  };
}

function ensurePolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    if (listeners.size === 0) return;
    fetchOnce(ACTIVE_ONLY).catch(() => {});
    fetchOnce(ALL).catch(() => {});
  }, 5000);
}

function subscribe(kind: string, cb: () => void) {
  listeners.add(cb);
  if (listeners.size === 1) {
    ensureStream();
    ensurePolling();
  }
  if (stores[kind].cache.length === 0 && stores[kind].loading) {
    fetchOnce(kind).catch(() => {});
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) {
      if (es) { es.close(); es = null; }
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    }
  };
}

function getServerSnapshot(kind: string): Patient[] {
  return stores[kind].cache;
}

export function usePatientStore(kind: string) {
  const subscribeWrapped = useCallback((cb: () => void) => subscribe(kind, cb), [kind]);
  const getSnapshot = useCallback(() => stores[kind].cache, [kind]);
  const patients = useSyncExternalStore(subscribeWrapped, getSnapshot, () => getServerSnapshot(kind));
  const refresh = useCallback(() => {
    stores[kind].lastFetch = 0;
    fetchOnce(kind).catch(() => {});
  }, [kind]);
  return { patients, loading: stores[kind].loading, error: stores[kind].error, refresh };
}

export const ALL_PATIENTS = ALL;
export const ACTIVE_PATIENTS = ACTIVE_ONLY;
