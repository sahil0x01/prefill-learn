// The single source of hardware numbers. Every widget reads from here, so a
// spec gets fixed in one place. Dense (non-sparse) peak throughput.
// Re-check against vendor datasheets and update `verified` when you do.

export interface Gpu {
  id: string;
  name: string;
  memoryGB: number;
  /** HBM / GDDR bandwidth, TB/s */
  bandwidthTBs: number;
  /** Dense BF16 tensor-core peak, TFLOP/s */
  bf16TFLOPs: number;
  /** Dense FP8 tensor-core peak, TFLOP/s (undefined if not supported) */
  fp8TFLOPs?: number;
  verified: string;
  source: string;
}

export const gpus: Gpu[] = [
  {
    id: 'a100-80gb-sxm',
    name: 'NVIDIA A100 80GB SXM',
    memoryGB: 80,
    bandwidthTBs: 2.039,
    bf16TFLOPs: 312,
    verified: '2026-11-25',
    source: 'https://www.nvidia.com/en-us/data-center/a100/',
  },
  {
    id: 'h100-sxm',
    name: 'NVIDIA H100 SXM',
    memoryGB: 80,
    bandwidthTBs: 3.35,
    bf16TFLOPs: 989,
    fp8TFLOPs: 1979,
    verified: '2026-11-25',
    source: 'https://www.nvidia.com/en-us/data-center/h100/',
  },
  {
    id: 'h200-sxm',
    name: 'NVIDIA H200 SXM',
    memoryGB: 141,
    bandwidthTBs: 4.8,
    bf16TFLOPs: 989,
    fp8TFLOPs: 1979,
    verified: '2026-11-25',
    source: 'https://www.nvidia.com/en-us/data-center/h200/',
  },
  {
    id: 'l40s',
    name: 'NVIDIA L40S',
    memoryGB: 48,
    bandwidthTBs: 0.864,
    bf16TFLOPs: 362,
    fp8TFLOPs: 733,
    verified: '2026-11-25',
    source: 'https://www.nvidia.com/en-us/data-center/l40s/',
  },
];
