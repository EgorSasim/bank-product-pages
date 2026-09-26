export const segments = ['default', 'salary', 'premium'] as const;

export type Segment = (typeof segments)[number];

export function readSegment(header: string | undefined): Segment {
  if (header === 'salary' || header === 'premium' || header === 'default') {
    return header;
  }
  return 'default';
}
