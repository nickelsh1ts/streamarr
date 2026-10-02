class ScanQueue {
  private tail: Promise<unknown> = Promise.resolve();

  /** `maxWaitMs` bounds time spent queued; it does not limit the task's own runtime. */
  enqueue<T>(
    task: () => Promise<T>,
    maxWaitMs?: number,
    signal?: AbortSignal
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let abandoned = false;
      let timer: NodeJS.Timeout | undefined;

      const abandon = (message: string) => {
        abandoned = true;
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        reject(new Error(message));
      };
      const onAbort = () => abandon('Disk scan was cancelled');

      if (signal?.aborted) {
        abandon('Disk scan was cancelled');
        return;
      }

      signal?.addEventListener('abort', onAbort, { once: true });

      if (maxWaitMs) {
        timer = setTimeout(
          () => abandon('Timed out waiting for disk scan queue'),
          maxWaitMs
        );
      }

      const run = async () => {
        if (abandoned) return;

        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);

        try {
          resolve(await task());
        } catch (e) {
          reject(e);
        }
      };

      this.tail = this.tail.then(run, run);
    });
  }
}

export const diskScanQueue = new ScanQueue();
