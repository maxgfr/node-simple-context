import { createSimpleContext, SimpleContext } from '..';

describe('SimpleContext', () => {
  it('should create a context', () => {
    const context = createSimpleContext();
    expect(context).toBeInstanceOf(SimpleContext);
  });

  it('should get a value from a context', () => {
    const context = createSimpleContext();
    context.set('A', 10);
    const res = context.get<number>('A');
    expect(res).toBe(10);
  });

  it('should display value in order with fork', async () => {
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
    expect(res).toStrictEqual(['foo=tata', 'foo=bar', 'foo=toto']);
  });

  it('should display value in order', async () => {
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
    expect(res).toStrictEqual(['foo=tata', 'foo=bar', 'foo=toto']);
  });
});
