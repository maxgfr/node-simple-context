import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * SimpleContext - A minimalist context manager for Node.js using AsyncLocalStorage
 *
 * Inspired by React Context, this class allows you to create and manage isolated
 * contexts that work seamlessly with async/await and promises.
 *
 * @typeParam Schema - An optional type defining the keys and value types for this context.
 * When provided, all operations are fully type-safe. When omitted, keys are unconstrained strings
 * and values are typed as `unknown`.
 *
 * @example
 * ```ts
 * // Untyped usage
 * const context = createSimpleContext();
 * context.set('userId', '12345');
 * const userId = context.get('userId'); // unknown | undefined
 *
 * // Typed usage (recommended)
 * type MySchema = { userId: string; count: number };
 * const context = createSimpleContext<MySchema>();
 * context.set('userId', '12345'); // type-checked
 * const userId = context.get('userId'); // string | undefined
 * ```
 */
export class SimpleContext<
  Schema extends Record<string, unknown> = Record<string, unknown>,
> {
  private properties: Record<string, unknown> = {};
  private asyncLocalStorage: AsyncLocalStorage<Record<string, unknown>>;

  constructor() {
    this.asyncLocalStorage = new AsyncLocalStorage();
  }

  /**
   * Retrieves a value from the context by key.
   *
   * @param key - The key to retrieve. Must be a non-empty string.
   * @returns The value associated with the key, or undefined if not found.
   * @throws {TypeError} If key is not a string or is empty.
   *
   * @example
   * ```ts
   * const userId = context.get('userId'); // string | undefined (with typed schema)
   * ```
   */
  public get<K extends string & keyof Schema>(key: K): Schema[K] | undefined {
    this.validateKey(key);
    return this.getForkProperty(key) as Schema[K] | undefined;
  }

  /**
   * Sets a value in the context by key.
   *
   * @param key - The key to set. Must be a non-empty string.
   * @param value - The value to associate with the key.
   * @throws {TypeError} If key is not a string or is empty.
   *
   * @example
   * ```ts
   * context.set('userId', '12345');
   * ```
   */
  public set<K extends string & keyof Schema>(key: K, value: Schema[K]): void {
    this.validateKey(key);
    this.setForkProperty(key, value);
  }

  /**
   * Deletes a value from the context by key.
   *
   * @param key - The key to delete. Must be a non-empty string.
   * @returns true if the key existed and was deleted, false if it didn't exist.
   * @throws {TypeError} If key is not a string or is empty.
   *
   * @example
   * ```ts
   * context.delete('userId');
   * ```
   */
  public delete<K extends string & keyof Schema>(key: K): boolean {
    this.validateKey(key);
    const existed = this.has(key);
    const store = this.asyncLocalStorage.getStore();
    if (store) {
      delete store[key];
    } else {
      delete this.properties[key];
    }
    return existed;
  }

  /**
   * Checks if a key exists in the context.
   *
   * @param key - The key to check. Must be a non-empty string.
   * @returns true if the key exists, false otherwise.
   * @throws {TypeError} If key is not a string or is empty.
   *
   * @example
   * ```ts
   * if (context.has('userId')) {
   *   // User ID is set
   * }
   * ```
   */
  public has<K extends string & keyof Schema>(key: K): boolean {
    this.validateKey(key);
    const store = this.asyncLocalStorage.getStore();
    return store
      ? Object.prototype.hasOwnProperty.call(store, key)
      : Object.prototype.hasOwnProperty.call(this.properties, key);
  }

  /**
   * Clears all values from the current context.
   *
   * @example
   * ```ts
   * context.clear();
   * ```
   */
  public clear(): void {
    const store = this.asyncLocalStorage.getStore();
    if (store) {
      for (const key of Object.keys(store)) {
        delete store[key];
      }
    } else {
      this.properties = {};
    }
  }

  /**
   * Gets all key-value pairs from the current context as a plain object.
   * Returns a shallow copy to prevent external mutations.
   *
   * @returns A shallow copy of all key-value pairs in the current context.
   *
   * @example
   * ```ts
   * const allValues = context.getAll();
   * // allValues => { userId: '12345', sessionId: 'abc' }
   * ```
   */
  public getAll(): Partial<Schema> {
    const store = this.asyncLocalStorage.getStore();
    return (store ? { ...store } : { ...this.properties }) as Partial<Schema>;
  }

  /**
   * Gets all keys from the current context.
   *
   * @returns An array of all keys in the current context.
   *
   * @example
   * ```ts
   * const keys = context.keys();
   * // keys => ['userId', 'sessionId']
   * ```
   */
  public keys(): Array<string & keyof Schema> {
    const store = this.asyncLocalStorage.getStore();
    return Object.keys(store ?? this.properties) as Array<
      string & keyof Schema
    >;
  }

  /**
   * Gets the number of key-value pairs in the current context.
   *
   * @returns The number of entries in the context.
   *
   * @example
   * ```ts
   * const size = context.size();
   * // size => 2
   * ```
   */
  public size(): number {
    return this.keys().length;
  }

  /**
   * Creates a new forked context or runs a callback within a forked context.
   *
   * When called with a callback, it executes the callback within the forked context
   * and returns the callback's return value. This is the recommended form.
   *
   * @param callback - The callback to execute within the forked context.
   * @returns The callback's return value.
   *
   * @example
   * ```ts
   * const result = context.fork(() => {
   *   context.set('foo', 'bar');
   *   return 'hello';
   * });
   * ```
   */
  public fork<T>(callback: () => T): T;
  /**
   * Creates a new forked context without a callback.
   *
   * @deprecated Use `fork(callback)` instead. The no-callback form uses
   * `AsyncLocalStorage.enterWith()` which permanently replaces the store for the
   * entire current async execution context. There is no way to "unfork" after calling it.
   *
   * @returns The SimpleContext instance.
   *
   * @example
   * ```ts
   * // Prefer the callback form instead:
   * context.fork(() => {
   *   context.set('foo', 'bar');
   * });
   * ```
   */
  public fork(): SimpleContext<Schema>;
  public fork<T>(callback?: () => T): SimpleContext<Schema> | T {
    const currentStore = this.asyncLocalStorage.getStore();
    const forkedProperties = currentStore
      ? { ...currentStore }
      : { ...this.properties };

    if (callback) {
      return this.asyncLocalStorage.run(forkedProperties, callback);
    }
    this.asyncLocalStorage.enterWith(forkedProperties);
    return this;
  }

  /**
   * Validates that a key is a non-empty string.
   *
   * @param key - The key to validate.
   * @throws {TypeError} If key is not a string or is empty.
   */
  private validateKey(key: unknown): void {
    if (typeof key !== 'string') {
      throw new TypeError(
        `Context key must be a string, received: ${typeof key}`,
      );
    }
    if (key.length === 0) {
      throw new TypeError('Context key cannot be an empty string');
    }
  }

  /**
   * Internal method to set a property in the appropriate context scope.
   */
  private setForkProperty(key: string, value: unknown): void {
    const store = this.asyncLocalStorage.getStore();
    if (store) {
      store[key] = value;
    } else {
      this.properties[key] = value;
    }
  }

  /**
   * Internal method to get a property from the appropriate context scope.
   */
  private getForkProperty(key: string): unknown {
    const store = this.asyncLocalStorage.getStore();
    return store ? store[key] : this.properties[key];
  }
}

/**
 * Factory function to create a new SimpleContext instance.
 *
 * @typeParam Schema - An optional type defining the keys and value types for this context.
 * @returns A new SimpleContext instance.
 *
 * @example
 * ```ts
 * // Untyped
 * const context = createSimpleContext();
 *
 * // Typed (recommended)
 * type MySchema = { userId: string; role: 'admin' | 'user' };
 * const context = createSimpleContext<MySchema>();
 * context.set('userId', '123');    // OK
 * context.set('role', 'admin');    // OK
 * context.set('role', 'invalid');  // Type error!
 * context.set('unknown', 'value'); // Type error!
 * ```
 */
export function createSimpleContext<
  Schema extends Record<string, unknown> = Record<string, unknown>,
>(): SimpleContext<Schema> {
  return new SimpleContext<Schema>();
}
