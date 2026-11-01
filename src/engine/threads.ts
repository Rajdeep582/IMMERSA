/**
 * Thread budget. Browsers expose the logical core count (`navigator.hardwareConcurrency`); work that
 * can run in parallel (mesh decompression, slice cutting) is spread over all spare cores, keeping one
 * for the main thread that drives input and WebGL.
 */
export const cores = () => Math.max(1, Math.min(16, navigator.hardwareConcurrency || 4));
export const workerCount = (max = 8) => Math.max(1, Math.min(max, cores() - 1));
