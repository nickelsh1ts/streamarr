class ScanQueue {
  private tail: Promise<unknown> = Promise.resolve();

  enqueue<T>(
    task: () => Promise<T>,
    maxWaitMs?: number,
    signal?: AbortSignal
  ): Promise<T> {
    const deadline = maxWaitMs ? Date.now() + maxWaitMs : undefined;
    const run = () => {
      if (signal?.aborted) {
        return Promise.reject(new Error('Disk scan was cancelled'));
      }

      if (deadline && Date.now() >= deadline) {
        return Promise.reject(
          new Error('Timed out waiting for disk scan queue')
        );
      }

      return task();
    };
    const result = this.tail.then(run, run);

    this.tail = result.then(
      () => undefined,
      () => undefined
    );

    return result;
  }
}

export const diskScanQueue = new ScanQueue();
