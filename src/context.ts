import { randomUUID } from 'crypto';
import async_hooks from 'async_hooks';

export class SimpleContext {
  private contextId: string;
  private properties: Record<string, unknown> = {};
  private forks: Array<SimpleContext> = [];
  private isFork: boolean;

  constructor(id = randomUUID(), isFork = false) {
    this.contextId = id;
    this.isFork = isFork;
  }

  public get<T>(key: string): T | undefined {
    if (this.isFork) {
      return this.getForkProperty(key);
    }
    return this.properties[key] as T | undefined;
  }

  public set<T>(key: string, value: T): void {
    if (this.isFork) {
      return this.setForkProperty(key, value);
    }
    this.properties[key] = value;
  }

  public fork(): void {
    const id = async_hooks.executionAsyncId().toString();
    this.forks = [...this.forks, new SimpleContext(id)];
  }

  private setForkProperty<T>(key: string, value: T): void {
    const id = async_hooks.executionAsyncId().toString();
    const fork = this.forks.find((fork) => fork.contextId === id);
    if (fork) {
      fork.set(key, value);
    }
  }

  private getForkProperty<T>(key: string): T | undefined {
    const id = async_hooks.executionAsyncId().toString();
    const fork = this.forks.find((fork) => fork.contextId === id);
    if (fork) {
      return fork.get<T>(key);
    }
    return undefined;
  }
}

export function createSimpleContext(): SimpleContext {
  return new SimpleContext();
}
