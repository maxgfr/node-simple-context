import { randomUUID } from 'crypto';
import async_hooks from 'async_hooks';

export class SimpleContext {
  private contextId: string;
  private properties: { [key: string]: any } = {};
  private forks: Array<SimpleContext> = [];

  constructor(private id = randomUUID()) {
    this.contextId = this.id;
  }

  public getProperty(key: string): any {
    return this.properties[key];
  }

  public setProperty(key: string, value: any): void {
    this.properties[key] = value;
  }

  public fork(): void {
    const id = async_hooks.executionAsyncId().toString();
    this.forks = [...this.forks, new SimpleContext(id)];
  }

  public setForkProperty(key: string, value: any): void {
    const id = async_hooks.executionAsyncId().toString();
    const fork = this.forks.find((fork) => fork.contextId === id);
    if (fork) {
      fork.setProperty(key, value);
    }
  }

  public getForkProperty(key: string): any {
    const id = async_hooks.executionAsyncId().toString();
    const fork = this.forks.find((fork) => fork.contextId === id);
    if (fork) {
      return fork.getProperty(key);
    }
    return undefined;
  }
}

export function createSimpleContext(): SimpleContext {
  return new SimpleContext();
}
