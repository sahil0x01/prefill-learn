// Pure formulas shared by widgets and anything else that needs them.
// Keep these free of UI code so they can be unit-tested.
import type { ModelConfig } from '../data/models';

/** Bytes of KV cache per token: K and V, for every layer and KV head. */
export function kvBytesPerToken(m: ModelConfig, bytesPerValue: number) {
  return 2 * m.layers * m.kvHeads * m.headDim * bytesPerValue;
}

export function weightBytes(m: ModelConfig, bytesPerParam: number) {
  return m.paramsB * 1e9 * bytesPerParam;
}

export function formatBytes(b: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (b >= 1000 && i < units.length - 1) {
    b /= 1000;
    i++;
  }
  return `${b.toFixed(b < 10 && i > 0 ? 2 : b < 100 ? 1 : 0)} ${units[i]}`;
}
