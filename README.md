# node-simple-context

A simple helper to create a context in node.

## Examples

### Simple

1. Create a new file `my-context.ts` in which you define your context.

```ts
import { createContext } from 'node-simple-context';

export const contextA = createContext();
export const contextB = createContext();
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
contextA.get('foo'); // bar
contextB.get('foo'); // baz
```

### Complex

```ts
const context = createContext();

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

:warning: I advice you to use [nctx](https://github.com/devthejo/nctx) which uses `async_hooks` to detect dynamically the context in asynchronous call.
