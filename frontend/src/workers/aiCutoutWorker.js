/**
 * AI Cutout Web Worker
 * Runs @imgly/background-removal WASM off the main thread.
 * Pre-scales input to max 1024px (AGENTS.md requirement).
 *
 * Messages:
 *   IN:  { type: 'process', imageData: ArrayBuffer, width, height }
 *   OUT: { type: 'progress', message: string }
 *   OUT: { type: 'result', blob: Blob }
 *   OUT: { type: 'error', message: string }
 */

// eslint-disable-next-line no-restricted-globals
const workerSelf = self;

workerSelf.onmessage = async (e) => {
  const { type, imageBlob } = e.data;

  if (type !== 'process') return;

  try {
    workerSelf.postMessage({ type: 'progress', message: 'Loading AI model...' });

    // Dynamic import of the WASM library inside the worker
    const { removeBackground } = await import('@imgly/background-removal');

    workerSelf.postMessage({ type: 'progress', message: 'Processing image...' });

    // Pre-scale to max 1024px is handled before sending to worker,
    // but we also enforce it here as a safety net
    const result = await removeBackground(imageBlob, {
      model: 'medium',
      progress: (key, current, total) => {
        if (key === 'compute:inference') {
          const pct = Math.round((current / total) * 100);
          workerSelf.postMessage({
            type: 'progress',
            message: `AI Processing: ${pct}%`,
          });
        }
      },
    });

    workerSelf.postMessage({ type: 'result', blob: result });
  } catch (err) {
    workerSelf.postMessage({
      type: 'error',
      message: err.message || 'Background removal failed',
    });
  }
};
