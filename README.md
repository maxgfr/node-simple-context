# node-simple-context

`node-simple-context` is an helper to create a context in node.

This library is highly inspired by [nctx](https://github.com/devthejo/nctx).

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

#### With [`async_hooks`](https://nodejs.org/api/async_hooks.html)

```ts
const context = createSimpleContext();

const func = (): string => {
  const foo = context.getForkProperty('foo');
  return `foo=${foo}`;
};

context.fork();
context.setForkProperty('foo', 'bar');

const res = await Promise.all([
  new Promise((resolve) => {
    setTimeout(() => {
      context.fork();
      context.setForkProperty('foo', 'tata');
      resolve(func());
    }, 400);
  }),
  func(),
  new Promise((resolve) => {
    setTimeout(() => {
      context.fork();
      context.setForkProperty('foo', 'toto');
      resolve(func());
    }, 200);
  }),
]);

console.log(res); // ['foo=tata', 'foo=bar', 'foo=toto']
```

#### Without [`async_hooks`](https://nodejs.org/api/async_hooks.html)

Here, I define multiple contexts in the same file, like that:

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
    setTimeout(() => {
      contextA.setProperty('foo', 'tata');
      resolve(func(contextA));
    }, 400);
  }),
  func(contextC),
  new Promise((resolve) => {
    setTimeout(() => {
      contextB.setProperty('foo', 'toto');
      resolve(func(contextB));
    }, 200);
  }),
]);

console.log(res); // ['foo=tata', 'foo=bar', 'foo=toto']
```
