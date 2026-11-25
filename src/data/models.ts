// Model architecture numbers, taken from each model's config.json.

export interface ModelConfig {
  id: string;
  name: string;
  /** Total parameters, billions */
  paramsB: number;
  layers: number;
  hidden: number;
  attentionHeads: number;
  /** Fewer than attentionHeads means GQA/MQA */
  kvHeads: number;
  headDim: number;
  maxContext: number;
  source: string;
}

export const models: ModelConfig[] = [
  {
    id: 'llama-3.1-8b',
    name: 'Llama 3.1 8B',
    paramsB: 8.03,
    layers: 32,
    hidden: 4096,
    attentionHeads: 32,
    kvHeads: 8,
    headDim: 128,
    maxContext: 131072,
    source: 'https://huggingface.co/meta-llama/Llama-3.1-8B/blob/main/config.json',
  },
  {
    id: 'llama-3.1-70b',
    name: 'Llama 3.1 70B',
    paramsB: 70.6,
    layers: 80,
    hidden: 8192,
    attentionHeads: 64,
    kvHeads: 8,
    headDim: 128,
    maxContext: 131072,
    source: 'https://huggingface.co/meta-llama/Llama-3.1-70B/blob/main/config.json',
  },
  {
    id: 'mistral-7b-v0.3',
    name: 'Mistral 7B v0.3',
    paramsB: 7.25,
    layers: 32,
    hidden: 4096,
    attentionHeads: 32,
    kvHeads: 8,
    headDim: 128,
    maxContext: 32768,
    source: 'https://huggingface.co/mistralai/Mistral-7B-v0.3/blob/main/config.json',
  },
];

export const DTYPE_BYTES = { fp32: 4, bf16: 2, fp16: 2, fp8: 1, int4: 0.5 } as const;
export type Dtype = keyof typeof DTYPE_BYTES;
