# node-simple-context

`node-simple-context` is an helper to create a context in node.

## Installation

```sh
npm install --save node-simple-context
```

## Examples

### Simple

1. Create a new file `my-context.ts` in which you define your context.

```ts
import { createSimpleContext } from 'node-simple-context';

export const contextA = createSimpleContext();
export const contextB = createSimpleContext();
```

2. You now can set the context

```ts
import { contextA, contextB } from './my-context';
contextA.set('foo', 'bar');
contextB.set('foo', 'baz');
```

3. In an other file, you can get your context value

```ts
import { contextA, contextB } from './my-context';
console.log(contextA.get('foo')); // bar
console.log(contextB.get('foo')); // baz
console.log(contextA.get('xxx')); // undefined
```

### Complex

```ts
const context = createSimpleContext();

const func = (forkId: string): string => {
  const foo = context.getForkProperty(forkId, 'foo');
  return `foo=${foo}`;
};

context.fork('X');
context.setForkProperty('X', 'foo', 'bar');

const res = await Promise.all([
  new Promise((resolve) => {
    context.fork('A');
    context.setForkProperty('A', 'foo', 'tata'),
      setTimeout(() => {
        resolve(func('A'));
      }, 400);
  }),
  func('X'),
  new Promise((resolve) => {
    context.fork('B');
    context.setForkProperty('B', 'foo', 'toto'),
      setTimeout(() => {
        resolve(func('B'));
      }, 200);
  }),
]);

console.log(res); // ['foo=tata', 'foo=bar', 'foo=toto']
```

To achieve this, you can also define multiple contexts in the same file, like that:

```ts
const contextA = createSimpleContext();
const contextB = createSimpleContext();
const contextC = createSimpleContext();

const func = (context: SimpleContext): string => {
  const foo = context.getProperty('foo');
  return `foo=${foo}`;
};

contextC.setProperty('foo', 'bar');

const res = await Promise.all([
  new Promise((resolve) => {
    contextA.setProperty('foo', 'tata'),
      setTimeout(() => {
        resolve(func(contextA));
      }, 400);
  }),
  func(contextC),
  new Promise((resolve) => {
    contextB.setProperty('foo', 'toto'),
      setTimeout(() => {
        resolve(func(contextB));
      }, 200);
  }),
]);

console.log(res); // ['foo=tata', 'foo=bar', 'foo=toto']
```

:warning: Otherwise, I advice you to use [nctx](https://github.com/devthejo/nctx) which uses `async_hooks` to detect dynamically the context in asynchronous call.
