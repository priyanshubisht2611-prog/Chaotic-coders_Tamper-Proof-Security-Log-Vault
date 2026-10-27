export type WindowStatus = 'intact' | 'tampered' | 'missing';

export interface LogWindow {
  id: number;
  start: string;
  end: string;
  hash: string;
  anchoredAt: string;
  status: WindowStatus;
  detectedAt?: string;
}
