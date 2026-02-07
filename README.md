# node-simple-context

`node-simple-context` is a helper to create a context in Node.js.

This library is highly inspired by [nctx](https://github.com/devthejo/nctx). You definitely should check it out! Thanks to [@devthejo](https://github.com/devthejo) for his help

## Installation

```sh
npm install node-simple-context
```

## API Reference

### `createSimpleContext()`

Creates a new `SimpleContext` instance.

```ts
import { createSimpleContext } from 'node-simple-context';

const context = createSimpleContext();
```

### `SimpleContext` class

#### `get<T>(key: string): T | undefined`

Retrieves a value from the context by key.

**Parameters:**
- `key` - The key to retrieve. Must be a non-empty string.

**Returns:** The value associated with the key, or `undefined` if not found.

**Throws:** `TypeError` if key is not a string or is empty.

**Example:**
```ts
const userId = context.get<string>('userId');
```

#### `set<T>(key: string, value: T): void`

Sets a value in the context by key.

**Parameters:**
- `key` - The key to set. Must be a non-empty string.
- `value` - The value to associate with the key.

**Throws:** `TypeError` if key is not a string or is empty.

**Example:**
```ts
context.set('userId', '12345');
```

#### `delete(key: string): boolean`

Deletes a value from the context by key.

**Parameters:**
- `key` - The key to delete. Must be a non-empty string.

**Returns:** `true` if the operation succeeded (even if key didn't exist).

**Throws:** `TypeError` if key is not a string or is empty.

**Example:**
```ts
context.delete('userId');
```

#### `has(key: string): boolean`

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

#### `getAll(): Record<string, unknown>`

Gets all key-value pairs from the current context as a plain object.

**Returns:** A shallow copy of all key-value pairs in the current context.

**Example:**
```ts
const allValues = context.getAll();
console.log(allValues); // { userId: '12345', sessionId: 'abc' }
```

#### `keys(): string[]`

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

#### `fork<T>(callback?: () => T): SimpleContext | T`

Creates a new forked context or runs a callback within a forked context.

**Parameters:**
- `callback` - Optional callback to execute within the forked context.

**Returns:** The `SimpleContext` instance (if no callback) or the callback's return value.

**Behavior:**
- When called without a callback, it creates a new context scope that inherits the current properties. Subsequent changes won't affect the parent context.
- When called with a callback, it executes the callback within the forked context and returns the callback's return value.

**Examples:**
```ts
// Without callback - for use with async operations
context.fork().set('foo', 'bar');

// With callback - execute and return value
const result = context.fork(() => {
  context.set('foo', 'bar');
  return 'hello';
});
```

## Usage Examples

### Basic usage

#### 1. Create a new file `my-context.ts` in which you define your context.

```ts
import { createSimpleContext } from 'node-simple-context';

export const contextA = createSimpleContext();
export const contextB = createSimpleContext();
```

#### 2. You now can set the context in your code wherever you want

```ts
import { contextA, contextB } from './my-context';

contextA.set('foo', 'bar');
contextB.set('foo', 'baz');
```

#### 3. And, get your context value wherever you want

```ts
import { contextA, contextB } from './my-context';

console.log(contextA.get('foo')); // bar
console.log(contextB.get('foo')); // baz
console.log(contextA.get('xxx')); // undefined

// in typescript
console.log(contextA.get<string>('foo')); // bar
```

### Using additional methods

```ts
const context = createSimpleContext();

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

### Complex examples

#### By forking your context

Thanks to [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html) API, you can `fork` your context in promise or async functions. As you can see below:

> You can also pass a callback in `fork` method to runs a function synchronously within a context and returns its return value which uses [run method from AsyncLocalStorage](https://nodejs.org/api/async_context.html#asynclocalstoragerunstore-callback-args) (cf. [example](./src/__tests__/context.test.ts#L134))

```ts
const context = createSimpleContext();

const func = (): string => {
  const foo = context.get('foo');
  return `foo=${foo}`;
};

context.fork();
context.set('foo', 'bar');

const res = await Promise.all([
  new Promise((resolve) => {
    context.fork().set('foo', 'tata');
    setTimeout(() => {
      resolve(func());
    }, 400);
  }),
  new Promise((resolve) => {
    context.fork().set('foo', 'toto');
    setTimeout(() => {
      resolve(func());
    }, 200);
  }),
  new Promise((resolve) => {
    context.fork().set('foo', 'titi');
    setTimeout(() => {
      resolve(func());
    }, 100);
  }),
  new Promise((resolve) => {
    context.fork().set('foo', 'tutu');
    setTimeout(() => {
      resolve(func());
    }, 600);
  }),
]);

console.log(res); // ['foo=tata', 'foo=toto', 'foo=titi', 'foo=tutu']
```

#### By using multiple contexts

```ts
const contextA = createSimpleContext();
const contextB = createSimpleContext();
const contextC = createSimpleContext();
const contextD = createSimpleContext();

const func = (context: SimpleContext): string => {
  const foo = context.get('foo');
  return `foo=${foo}`;
};

const res = await Promise.all([
  new Promise((resolve) => {
    contextA.set('foo', 'tata');
    setTimeout(() => {
      resolve(func(contextA));
    }, 400);
  }),
  new Promise((resolve) => {
    contextB.set('foo', 'toto');
    setTimeout(() => {
      resolve(func(contextB));
    }, 200);
  }),
  new Promise((resolve) => {
    contextC.set('foo', 'titi');
    setTimeout(() => {
      resolve(func(contextC));
    }, 100);
  }),
  new Promise((resolve) => {
    contextD.set('foo', 'tutu');
    setTimeout(() => {
      resolve(func(contextD));
    }, 600);
  }),
]);

console.log(res); // ['foo=tata', 'foo=toto', 'foo=titi', 'foo=tutu']
```

#### By using multiple keys

```ts
const context = createSimpleContext();

const func = (key: string): string => {
  const foo = context.get(key);
  return `foo=${foo}`;
};

const res = await Promise.all([
  new Promise((resolve) => {
    context.set('foo1', 'tata');
    setTimeout(() => {
      resolve(func('foo1'));
    }, 400);
  }),
  new Promise((resolve) => {
    context.set('foo2', 'toto');
    setTimeout(() => {
      resolve(func('foo2'));
    }, 200);
  }),
  new Promise((resolve) => {
    context.set('foo3', 'titi');
    setTimeout(() => {
      resolve(func('foo3'));
    }, 100);
  }),
  new Promise((resolve) => {
    context.set('foo4', 'tutu');
    setTimeout(() => {
      resolve(func('foo4'));
    }, 600);
  }),
]);

console.log(res); // ['foo=tata', 'foo=toto', 'foo=titi', 'foo=tutu']
```

## License

MIT
