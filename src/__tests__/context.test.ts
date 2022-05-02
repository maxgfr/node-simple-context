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
        context.fork();
        context.set('foo', 'tata');
        setTimeout(() => {
          resolve(func());
        }, 400);
      }),
      new Promise((resolve) => {
        context.fork();
        context.set('foo', 'toto');
        setTimeout(() => {
          resolve(func());
        }, 200);
      }),
      new Promise((resolve) => {
        context.fork();
        context.set('foo', 'titi');
        setTimeout(() => {
          resolve(func());
        }, 100);
      }),
      new Promise((resolve) => {
        context.fork();
        context.set('foo', 'tutu');
        setTimeout(() => {
          resolve(func());
        }, 600);
      }),
    ]);
    expect(res).toStrictEqual(['foo=tata', 'foo=toto', 'foo=titi', 'foo=tutu']);
  });

  it('should display value in order with multiple context', async () => {
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
    expect(res).toStrictEqual(['foo=tata', 'foo=toto', 'foo=titi', 'foo=tutu']);
  });

  it('should display value in order with multiple value', async () => {
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
    expect(res).toStrictEqual(['foo=tata', 'foo=toto', 'foo=titi', 'foo=tutu']);
  });
});
