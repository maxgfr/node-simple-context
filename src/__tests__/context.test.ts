import { createContext, Context } from '../context';

describe('Context', () => {
  it('should create a context', () => {
    const context = createContext();
    expect(context).toBeInstanceOf(Context);
  });

  it('should display value in order', async () => {
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
    expect(res).toStrictEqual(['foo=tata', 'foo=bar', 'foo=toto']);
  });
});
