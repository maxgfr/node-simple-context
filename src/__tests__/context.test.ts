import { createSimpleContext, SimpleContext } from '..';

describe('SimpleContext', () => {
  it('should create a context', () => {
    const context = createSimpleContext();
    expect(context).toBeInstanceOf(SimpleContext);
  });

  it('should display value in order with fork', async () => {
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
    expect(res).toStrictEqual(['foo=tata', 'foo=bar', 'foo=toto']);
  });

  it('should display value in order', async () => {
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
    expect(res).toStrictEqual(['foo=tata', 'foo=bar', 'foo=toto']);
  });
});
