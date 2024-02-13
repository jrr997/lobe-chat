import { TracePayload } from '@/const/trace';

export const getTracePayload = (header: string | null): TracePayload | undefined => {
  if (!header) return;

  return JSON.parse(Buffer.from(header, 'base64').toString('utf8'));
};

export const createTracePayload = (data: TracePayload) => {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(JSON.stringify(data));

  return Buffer.from(buffer).toString('base64');
};
