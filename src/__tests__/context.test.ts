import { createSimpleContext, SimpleContext } from '..';

describe('SimpleContext', () => {
  it('should create a context', () => {
    const context = createSimpleContext();
    expect(context).toBeInstanceOf(SimpleContext);
  });

  it('should display value in order with fork', async () => {
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
          context.setForkProperty('foo', 'tata'), resolve(func());
        }, 400);
      }),
      func(),
      new Promise((resolve) => {
        setTimeout(() => {
          context.fork();
          context.setForkProperty('foo', 'toto'), resolve(func());
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
    expect(res).toStrictEqual(['foo=tata', 'foo=bar', 'foo=toto']);
  });
});
