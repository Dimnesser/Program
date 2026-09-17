import { useCallback, useEffect, useRef, useState } from 'react';
import { uid } from '@/lib/utils';
import { createZip, uniqueName, blobToBytes } from '@/lib/zip';
import type { LoadedImage } from './imageUtils';

export interface BatchResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  /** Filename the user gets on download. */
  name: string;
}

export interface BatchItem {
  id: string;
  source: LoadedImage;
  result?: BatchResult;
  status: 'idle' | 'working' | 'done' | 'error';
}

export type BatchProcessor = (
  image: LoadedImage,
) => Promise<{ blob: Blob; width: number; height: number; name: string } | null>;

export const MAX_BATCH = 40;

/**
 * Runs one image operation across a queue of files.
 *
 * Work is sequential on purpose: each step rasterises a full-size bitmap, and
 * doing several at once on a phone is what makes tabs die. Object URLs are
 * revoked whenever a result is replaced or an item leaves the queue.
 */
export function useImageBatch(process: BatchProcessor) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const latest = useRef(process);
  latest.current = process;

  useEffect(
    () => () => {
      // Unmount: release every object URL we still hold.
      setItems((current) => {
        current.forEach((item) => item.result && URL.revokeObjectURL(item.result.url));
        return [];
      });
    },
    [],
  );

  const add = useCallback((images: LoadedImage[]) => {
    setItems((current) => {
      const room = Math.max(0, MAX_BATCH - current.length);
      const next = images.slice(0, room).map<BatchItem>((source) => ({ id: uid('b'), source, status: 'idle' }));
      return [...current, ...next];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.result) URL.revokeObjectURL(target.result.url);
      return current.filter((item) => item.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    setItems((current) => {
      current.forEach((item) => item.result && URL.revokeObjectURL(item.result.url));
      return [];
    });
    setProgress(0);
  }, []);

  const run = useCallback(async () => {
    setBusy(true);
    setProgress(0);

    // Snapshot the queue so results land on the right rows even if the user edits it.
    const queue = await new Promise<BatchItem[]>((resolve) => {
      setItems((current) => {
        resolve(current);
        return current;
      });
    });

    let done = 0;
    for (const item of queue) {
      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: 'working' } : entry)));

      let produced: Awaited<ReturnType<BatchProcessor>> = null;
      try {
        produced = await latest.current(item.source);
      } catch {
        produced = null;
      }

      setItems((current) =>
        current.map((entry) => {
          if (entry.id !== item.id) return entry;
          if (entry.result) URL.revokeObjectURL(entry.result.url);
          if (!produced) return { ...entry, result: undefined, status: 'error' };
          return {
            ...entry,
            status: 'done',
            result: { ...produced, url: URL.createObjectURL(produced.blob) },
          };
        }),
      );

      done += 1;
      setProgress(Math.round((done / queue.length) * 100));
      // Yield to the event loop so the progress bar actually paints.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    setBusy(false);
  }, []);

  const downloadZip = useCallback(
    async (archiveName: string) => {
      const ready = items.filter((item) => item.result);
      if (ready.length === 0) return null;

      const taken = new Set<string>();
      const entries = await Promise.all(
        ready.map(async (item) => ({
          name: uniqueName(item.result!.name, taken),
          data: await blobToBytes(item.result!.blob),
        })),
      );
      return { blob: createZip(entries), name: archiveName };
    },
    [items],
  );

  const totals = items.reduce(
    (accumulator, item) => ({
      originalBytes: accumulator.originalBytes + item.source.size,
      resultBytes: accumulator.resultBytes + (item.result?.blob.size ?? 0),
      done: accumulator.done + (item.status === 'done' ? 1 : 0),
    }),
    { originalBytes: 0, resultBytes: 0, done: 0 },
  );

  return { items, add, remove, clear, run, downloadZip, busy, progress, totals };
}
