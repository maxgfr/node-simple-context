import asyncHooks from 'async_hooks';

export class SimpleContext {
  private properties: Record<string, unknown> = {};
  private asyncHooks: asyncHooks.AsyncHook;
  private store: Map<number, typeof this.properties | undefined>;

  constructor() {
    this.store = new Map();
    this.asyncHooks = asyncHooks.createHook({
      init: (asyncId, _, triggerAsyncId) => {
        if (this.store.has(triggerAsyncId)) {
          this.store.set(asyncId, this.store.get(triggerAsyncId));
        }
      },
      destroy: (asyncId) => {
        if (this.store.has(asyncId)) {
          this.store.delete(asyncId);
        }
      },
    });
    this.asyncHooks.enable();
  }

  public get<T>(key: string): T | undefined {
    return this.getForkProperty<T>(key);
  }

  public set<T>(key: string, value: T): void {
    return this.setForkProperty<T>(key, value);
  }

  public fork(): void {
    this.store.set(asyncHooks.executionAsyncId(), {});
  }

  private setForkProperty<T>(key: string, value: T): void {
    const store = this.store.get(asyncHooks.executionAsyncId());
    store ? (store[key] = value) : (this.properties[key] = value);
  }

  private getForkProperty<T>(key: string): T | undefined {
    const store = this.store.get(asyncHooks.executionAsyncId());
    return store
      ? (store[key] as T | undefined)
      : (this.properties[key] as T | undefined);
  }
}

export function createSimpleContext(): SimpleContext {
  return new SimpleContext();
}
