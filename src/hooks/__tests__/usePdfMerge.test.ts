import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Worker as a proper class that can be used with `new`
const workerInstances: MockWorker[] = [];

class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  terminated = false;

  constructor() {
    workerInstances.push(this);
  }

  postMessage(data: unknown) {
    setTimeout(() => {
      if (this.terminated) return;

      const msg = data as { type: string };
      if (msg.type === "merge") {
        // Send progress
        this.onmessage?.(
          new MessageEvent("message", {
            data: {
              type: "progress",
              progress: 0.5,
              currentFileName: "a.pdf",
            },
          })
        );
        // Send completion
        setTimeout(() => {
          if (this.terminated) return;
          const resultBytes = new Uint8Array([1, 2, 3]).buffer;
          this.onmessage?.(
            new MessageEvent("message", {
              data: { type: "done", result: resultBytes },
            })
          );
        }, 10);
      }
    }, 10);
  }

  terminate() {
    this.terminated = true;
  }
}

vi.stubGlobal("Worker", MockWorker);

import {
  createMergeWorker,
  type MergeWorkerMessage,
} from "@/hooks/usePdfMerge";

describe("createMergeWorker", () => {
  beforeEach(() => {
    workerInstances.length = 0;
  });

  it("進捗->完了フローが正しく動作する", async () => {
    const messages: MergeWorkerMessage[] = [];

    const { promise } = createMergeWorker({
      fileBuffers: [
        {
          name: "a.pdf",
          buffer: new ArrayBuffer(10),
          pageIndices: [0],
          rotations: [0],
        },
      ],
      outputFileName: "merged",
      onProgress: (msg) => messages.push(msg),
    });

    const result = await promise;
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(messages.some((m) => m.type === "progress")).toBe(true);
  });

  it("キャンセルでWorkerがterminateされる", async () => {
    const { promise, cancel } = createMergeWorker({
      fileBuffers: [
        {
          name: "a.pdf",
          buffer: new ArrayBuffer(10),
          pageIndices: [0],
          rotations: [0],
        },
      ],
      outputFileName: "merged",
      onProgress: () => {},
    });

    cancel();

    await expect(promise).rejects.toThrow("cancelled");
    expect(workerInstances).toHaveLength(1);
    expect(workerInstances[0].terminated).toBe(true);
  });
});
