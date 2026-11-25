// The numbered chapters of the knowledge-base index, in display order.
// Every note, widget and project sets `topic:` to one of these ids, and
// optionally `order:` to place it within the chapter.
// Chapters with no entries are hidden, so it's fine to list some ahead of time.
// There must always be at least one.
export const topics = [
  { id: 'foundations', title: 'Foundations' },
  { id: 'cpu-baseline', title: 'A naive engine on CPU' },
  { id: 'cpu-performance', title: 'Making the CPU fast' },
  { id: 'gpu-foundations', title: 'GPU foundations' },
  { id: 'kernels', title: 'Kernels and attention' },
  { id: 'quantization', title: 'Quantization' },
  { id: 'serving', title: 'Serving and scheduling' },
  { id: 'memory', title: 'Memory management' },
  { id: 'faster-decoding', title: 'Faster decoding' },
  { id: 'multi-gpu', title: 'Multi-GPU and scaling' },
  { id: 'architectures', title: 'Modern architectures' },
  { id: 'research', title: 'Research notes' },
] as const;

export type TopicId = (typeof topics)[number]['id'];
export const topicIds = topics.map((t) => t.id) as [TopicId, ...TopicId[]];
export const topicTitle = (id: string) => topics.find((t) => t.id === id)?.title ?? id;
