class ScanQueue {
  private tail: Promise<unknown> = Promise.resolve();

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = this.tail.then(task, task);

    this.tail = result.then(
      () => undefined,
      () => undefined
    );

    return result;
  }
}

export const diskScanQueue = new ScanQueue();
