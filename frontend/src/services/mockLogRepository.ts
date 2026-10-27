import { LogWindow } from '@/types/log';
import { LogRepository } from './logRepository';
import { INITIAL_MOCK_LOGS } from '@/data/mockLogs';

export class MockLogRepository implements LogRepository {
  private windows: LogWindow[] = [];

  constructor(initialLogs: readonly LogWindow[] = INITIAL_MOCK_LOGS) {
    this.windows = initialLogs.map((log) => ({ ...log }));
  }

  private async delay(): Promise<void> {
    const ms = Math.floor(Math.random() * 301) + 300; // 300-600ms
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getWindows(): Promise<LogWindow[]> {
    await this.delay();
    return this.windows.map((w) => ({ ...w }));
  }

  async tamperWindow(id: number): Promise<LogWindow> {
    await this.delay();
    const index = this.windows.findIndex((w) => w.id === id);
    if (index === -1) {
      throw new Error(`Window ${id} not found`);
    }

    const current = this.windows[index];
    const tampered: LogWindow = {
      ...current,
      status: 'tampered',
      detectedAt: new Date().toISOString(),
      hash: current.hash.split('').reverse().join(''),
    };
    this.windows[index] = tampered;
    return { ...tampered };
  }

  async deleteWindow(id: number): Promise<number> {
    await this.delay();
    const index = this.windows.findIndex((w) => w.id === id);
    if (index === -1) {
      throw new Error(`Window ${id} not found`);
    }
    this.windows[index] = {
      ...this.windows[index],
      status: 'missing',
      detectedAt: new Date().toISOString(),
    };
    return id;
  }

  async verifyAll(): Promise<LogWindow[]> {
    await this.delay();
    return this.windows.map((w) => ({ ...w }));
  }

  async reset(): Promise<LogWindow[]> {
    await this.delay();
    this.windows = INITIAL_MOCK_LOGS.map((log) => ({ ...log }));
    return this.windows.map((w) => ({ ...w }));
  }
}

export const defaultLogRepository = new MockLogRepository();
