import { AsyncLocalStorage } from 'async_hooks';

export class SimpleContext {
  private properties: Record<string, unknown> = {};
  private asyncLocalStorage: AsyncLocalStorage<typeof this.properties>;

  constructor() {
    this.asyncLocalStorage = new AsyncLocalStorage();
  }

  public get<T>(key: string): T | undefined {
    return this.getForkProperty<T>(key);
  }

  public set<T>(key: string, value: T): void {
    return this.setForkProperty<T>(key, value);
  }

  public fork<T>(callback: () => T): T;
  public fork(): SimpleContext;
  public fork<T>(callback?: () => T): SimpleContext | T {
    const forkedProperties = { ...this.properties };
    if (callback) {
      return this.asyncLocalStorage.run(forkedProperties, callback);
    }
    this.asyncLocalStorage.enterWith(forkedProperties);
    return this;
  }

  private setForkProperty<T>(key: string, value: T): void {
    const store = this.asyncLocalStorage.getStore();
    store ? (store[key] = value) : (this.properties[key] = value);
  }

  private getForkProperty<T>(key: string): T | undefined {
    const store = this.asyncLocalStorage.getStore();
    return store
      ? (store[key] as T | undefined)
      : (this.properties[key] as T | undefined);
  }
}

export function createSimpleContext(): SimpleContext {
  return new SimpleContext();
}
