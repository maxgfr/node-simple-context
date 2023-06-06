# node-simple-context

`node-simple-context` is an helper to create a context in node.

This library is highly inspired by [nctx](https://github.com/devthejo/nctx). You definitely should check it out!

## Installation

```sh
npm install node-simple-context
```

## Usage

### Simple example

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

### Complex examples

#### By forking your context

Thanks to [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html) api, you can `fork` your context in promise or async functions. As you can see below:

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
