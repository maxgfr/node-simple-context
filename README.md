# node-simple-context

`node-simple-context` is an helper to create a context in node.

## Installation

```sh
npm install --save node-simple-context
```

## Examples

### Simple

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

### Complex

#### By forking your context

Thanks to [`async_hooks`](https://nodejs.org/api/async_hooks.html) api, you can `fork` your context in promise or async functions. As you can see below:

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
    setTimeout(() => {
      context.fork();
      context.set('foo', 'tata');
      resolve(func());
    }, 400);
  }),
  func(),
  new Promise((resolve) => {
    setTimeout(() => {
      context.fork();
      context.set('foo', 'toto');
      resolve(func());
    }, 200);
  }),
]);

console.log(res); // ['foo=tata', 'foo=bar', 'foo=toto']
```

:warning: I advice you to use [nctx](https://github.com/devthejo/nctx) to get a context which uses `parentExecutionId` if you want to get your property in an other promise.

#### By using multiple contexts

The alternative is to define multiple contexts in the same file, like that:

```ts
const contextA = createSimpleContext();
const contextB = createSimpleContext();
const contextC = createSimpleContext();

const func = (context: SimpleContext): string => {
  const foo = context.get('foo');
  return `foo=${foo}`;
};

contextC.set('foo', 'bar');

const res = await Promise.all([
  new Promise((resolve) => {
    setTimeout(() => {
      contextA.set('foo', 'tata');
      resolve(func(contextA));
    }, 400);
  }),
  func(contextC),
  new Promise((resolve) => {
    setTimeout(() => {
      contextB.set('foo', 'toto');
      resolve(func(contextB));
    }, 200);
  }),
]);

console.log(res); // ['foo=tata', 'foo=bar', 'foo=toto']
```
