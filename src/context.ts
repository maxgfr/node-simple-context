import { randomUUID } from 'crypto';
import async_hooks from 'async_hooks';

export class SimpleContext {
  private contextId: string;
  private properties: Record<string, unknown> = {};
  private forks: Array<SimpleContext> = [];

  constructor(id = randomUUID()) {
    this.contextId = id;
  }

  public get<T>(key: string): T | undefined {
    return this.getForkProperty<T>(key);
  }

  public set<T>(key: string, value: T): void {
    return this.setForkProperty<T>(key, value);
  }

  public fork(): void {
    const id = async_hooks.executionAsyncId();
    this.forks = [...this.forks, new SimpleContext(id.toString())];
  }

  private setForkProperty<T>(key: string, value: T): void {
    const id = async_hooks.executionAsyncId().toString();
    const fork = this.forks.find((fork) => fork.contextId === id);
    return fork
      ? fork.setProperty<T>(key, value)
      : this.setProperty<T>(key, value);
  }

  private getForkProperty<T>(key: string): T | undefined {
    const id = async_hooks.executionAsyncId().toString();
    const fork = this.forks.find((fork) => fork.contextId === id);
    return fork ? fork.getProperty<T>(key) : this.getProperty<T>(key);
  }

  private setProperty<T>(key: string, value: T): void {
    this.properties[key] = value;
  }

  private getProperty<T>(key: string): T | undefined {
    return this.properties[key] as T | undefined;
  }
}

export function createSimpleContext(): SimpleContext {
  return new SimpleContext();
}
