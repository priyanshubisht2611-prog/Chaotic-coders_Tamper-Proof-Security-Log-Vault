import { LogWindow } from '@/types/log';

export interface LogRepository {
  getWindows(): Promise<LogWindow[]>;
  tamperWindow(id: number): Promise<LogWindow>;
  deleteWindow(id: number): Promise<number>;
  verifyAll(): Promise<LogWindow[]>;
  reset(): Promise<LogWindow[]>;
}
