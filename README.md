# node-simple-context

`node-simple-context` is a minimalist, type-safe context manager for Node.js, inspired by React Context.

Built on top of [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html), it provides isolated contexts that work seamlessly with async/await and promises — with zero runtime dependencies.

This library is highly inspired by [nctx](https://github.com/devthejo/nctx). You definitely should check it out! Thanks to [@devthejo](https://github.com/devthejo) for his help.

## Installation

```sh
npm install node-simple-context
```

## Quick start

### Typed context (recommended)

Define a schema for compile-time type safety on keys and values:

```ts
import { createSimpleContext } from 'node-simple-context';

type RequestSchema = {
  userId: string;
  role: 'admin' | 'user';
  requestId: string;
};

const context = createSimpleContext<RequestSchema>();

context.set('userId', '12345');     // OK
context.set('role', 'admin');       // OK
context.set('role', 'invalid');     // Type error!
context.set('unknown', 'value');    // Type error!

const userId = context.get('userId'); // string | undefined
const role = context.get('role');     // 'admin' | 'user' | undefined
```

### Untyped context

Without a schema, all string keys are accepted and values are `unknown`:

```ts
const context = createSimpleContext();

context.set('foo', 'bar');
context.set('count', 42);

const value = context.get('foo'); // unknown | undefined
```

## API Reference

### `createSimpleContext<Schema>()`

Creates a new `SimpleContext` instance. Optionally accepts a type parameter defining the context's keys and value types.

```ts
import { createSimpleContext } from 'node-simple-context';

// Untyped
const context = createSimpleContext();

// Typed
type MySchema = { userId: string; count: number };
const typedContext = createSimpleContext<MySchema>();
```

### `SimpleContext<Schema>` class

#### `get<K extends keyof Schema>(key: K): Schema[K] | undefined`

Retrieves a value from the context by key.

**Parameters:**
- `key` - The key to retrieve. Must be a non-empty string.

**Returns:** The value associated with the key, or `undefined` if not found.

**Throws:** `TypeError` if key is not a string or is empty.

**Example:**
```ts
const userId = context.get('userId'); // string | undefined (with typed schema)
```

#### `set<K extends keyof Schema>(key: K, value: Schema[K]): void`

Sets a value in the context by key.

**Parameters:**
- `key` - The key to set. Must be a non-empty string.
- `value` - The value to associate with the key. Must match the schema type.

**Throws:** `TypeError` if key is not a string or is empty.

**Example:**
```ts
context.set('userId', '12345');
```

#### `delete<K extends keyof Schema>(key: K): boolean`

Deletes a value from the context by key.

**Parameters:**
- `key` - The key to delete. Must be a non-empty string.

**Returns:** `true` if the key existed and was deleted, `false` if it didn't exist.

**Throws:** `TypeError` if key is not a string or is empty.

**Example:**
```ts
context.delete('userId');
```

#### `has<K extends keyof Schema>(key: K): boolean`

Checks if a key exists in the context.

**Parameters:**
- `key` - The key to check. Must be a non-empty string.

**Returns:** `true` if the key exists, `false` otherwise.

**Throws:** `TypeError` if key is not a string or is empty.

**Example:**
```ts
if (context.has('userId')) {
  console.log('User ID is set');
}
```

#### `clear(): void`

Clears all values from the current context.

**Example:**
```ts
context.clear();
```

#### `getAll(): Partial<Schema>`

Gets all key-value pairs from the current context as a plain object.

**Returns:** A shallow copy of all key-value pairs in the current context.

**Example:**
```ts
const allValues = context.getAll();
console.log(allValues); // { userId: '12345', sessionId: 'abc' }
```

#### `keys(): Array<keyof Schema>`

Gets all keys from the current context.

**Returns:** An array of all keys in the current context.

**Example:**
```ts
const keys = context.keys();
console.log(keys); // ['userId', 'sessionId']
```

#### `size(): number`

Gets the number of key-value pairs in the current context.

**Returns:** The number of entries in the context.

**Example:**
```ts
const count = context.size();
console.log(count); // 2
```

#### `fork<T>(callback: () => T): T`

Runs a callback within a forked context that inherits current values. Changes inside the fork don't affect the parent context. This is the recommended way to use fork.

**Parameters:**
- `callback` - The callback to execute within the forked context.

**Returns:** The callback's return value.

**Example:**
```ts
context.set('userId', 'parent');

const result = context.fork(() => {
  context.set('userId', 'child');
  return context.get('userId'); // 'child'
});

context.get('userId'); // 'parent' — unchanged
```

#### `fork(): SimpleContext<Schema>` *(deprecated)*

Creates a new forked context without a callback. **Deprecated** because it uses `AsyncLocalStorage.enterWith()` which permanently replaces the store for the entire current async execution context. Prefer `fork(callback)` instead.

## Usage Examples

### Using additional methods

```ts
type SessionSchema = {
  userId: string;
  sessionId: string;
};

const context = createSimpleContext<SessionSchema>();

// Set values
context.set('userId', '12345');
context.set('sessionId', 'abc-def');

// Check if a key exists
if (context.has('userId')) {
  console.log('User is logged in');
}

// Get the number of entries
console.log(context.size()); // 2

// Get all keys
console.log(context.keys()); // ['userId', 'sessionId']

// Get all values
console.log(context.getAll()); // { userId: '12345', sessionId: 'abc-def' }

// Delete a specific key
context.delete('sessionId');

// Clear all values
context.clear();
console.log(context.size()); // 0
```

### Forking context for async isolation

Thanks to [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html), you can `fork` your context to create isolated scopes in async operations:

```ts
const context = createSimpleContext();

context.set('requestId', 'root');

// Each fork gets its own isolated copy
const results = await Promise.all([
  context.fork(() => {
    context.set('requestId', 'req-1');
    return new Promise((resolve) => {
      setTimeout(() => resolve(context.get('requestId')), 100);
    });
  }),
  context.fork(() => {
    context.set('requestId', 'req-2');
    return new Promise((resolve) => {
      setTimeout(() => resolve(context.get('requestId')), 50);
    });
  }),
]);

console.log(results); // ['req-1', 'req-2']
console.log(context.get('requestId')); // 'root' — parent unchanged
```

### Nested forks

Forks can be nested to any depth, each level isolated from the others:

```ts
const context = createSimpleContext();
context.set('level', 'root');

context.fork(() => {
  context.set('level', 'child');

  context.fork(() => {
    context.set('level', 'grandchild');
    console.log(context.get('level')); // 'grandchild'
  });

  console.log(context.get('level')); // 'child'
});

console.log(context.get('level')); // 'root'
```

### Using multiple contexts

```ts
const contextA = createSimpleContext();
const contextB = createSimpleContext();

contextA.set('foo', 'from A');
contextB.set('foo', 'from B');

console.log(contextA.get('foo')); // 'from A'
console.log(contextB.get('foo')); // 'from B'
```

## ESM and CommonJS

This library supports both ESM and CommonJS:

```ts
// ESM
import { createSimpleContext } from 'node-simple-context';

// CommonJS
const { createSimpleContext } = require('node-simple-context');
```

## License

MIT
