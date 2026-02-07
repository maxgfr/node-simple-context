import { EventEmitter } from 'node:events';
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

  it('should work if the values are wrapped in a callback run', async () => {
    function Deferred<T>() {
      let resolve!: (value: T) => void;
      let reject!: (reason?: unknown) => void;
      const promise = new Promise<T>((thisResolve, thisReject) => {
        resolve = thisResolve;
        reject = thisReject;
      });
      return Object.assign(promise, { resolve, reject });
    }
    const emitter = new EventEmitter();

    const context = createSimpleContext();

    const deferredTiti = Deferred<string>();
    const deferredToto = Deferred<string>();
    emitter.on('titi', () => {
      context.fork(() => {
        context.set('foo', 'titi2');
      });
    });
    emitter.on('toto', () => {
      context.fork(() => {
        context.set('foo', 'toto2');
      });
    });

    setTimeout(() => {
      context.fork(() => {
        context.set('foo', 'titi');
        emitter.emit('titi');
        setTimeout(() => {
          deferredTiti.resolve(context.get<string>('foo')!);
        }, 50);
      });
    }, 100);
    setTimeout(() => {
      context.fork(() => {
        context.set('foo', 'toto');
        emitter.emit('toto');
        setTimeout(() => {
          deferredToto.resolve(context.get<string>('foo')!);
        }, 50);
      });
    }, 200);

    expect([await deferredTiti, await deferredToto]).toStrictEqual([
      'titi',
      'toto',
    ]);
  });

  it('should return good value with the callback', async () => {
    const context = createSimpleContext();

    const string = context
      .fork(() => {
        return 'hello';
      })
      .toUpperCase();

    expect(string).toBe('HELLO');
  });

  // New tests for added methods
  describe('delete method', () => {
    it('should delete a value from context', () => {
      const context = createSimpleContext();
      context.set('foo', 'bar');
      expect(context.get('foo')).toBe('bar');

      const result = context.delete('foo');
      expect(result).toBe(true);
      expect(context.get('foo')).toBeUndefined();
    });

    it('should return false when deleting non-existent key', () => {
      const context = createSimpleContext();
      const result = context.delete('nonexistent');
      expect(result).toBe(false);
    });

    it('should work with forked contexts', () => {
      const context = createSimpleContext();
      context.set('foo', 'parent');

      context.fork(() => {
        context.set('bar', 'child');
        expect(context.delete('bar')).toBe(true);
        expect(context.has('bar')).toBe(false);
      });
    });
  });

  describe('has method', () => {
    it('should return true for existing key', () => {
      const context = createSimpleContext();
      context.set('foo', 'bar');
      expect(context.has('foo')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      const context = createSimpleContext();
      expect(context.has('foo')).toBe(false);
    });

    it('should work with forked contexts', () => {
      const context = createSimpleContext();
      context.set('foo', 'parent');

      context.fork(() => {
        context.set('bar', 'child');
        expect(context.has('foo')).toBe(true);
        expect(context.has('bar')).toBe(true);
      });
    });
  });

  describe('clear method', () => {
    it('should clear all values from context', () => {
      const context = createSimpleContext();
      context.set('foo', 'bar');
      context.set('baz', 'qux');
      expect(context.size()).toBe(2);

      context.clear();
      expect(context.size()).toBe(0);
      expect(context.get('foo')).toBeUndefined();
      expect(context.get('baz')).toBeUndefined();
    });

    it('should work with forked contexts without affecting parent', () => {
      const context = createSimpleContext();
      context.set('foo', 'parent');
      context.set('bar', 'parent');

      context.fork(() => {
        context.set('child', 'value');
        context.clear();
        expect(context.size()).toBe(0);
      });

      expect(context.size()).toBe(2);
      expect(context.get('foo')).toBe('parent');
    });
  });

  describe('getAll method', () => {
    it('should return all key-value pairs', () => {
      const context = createSimpleContext();
      context.set('foo', 'bar');
      context.set('baz', 'qux');

      const all = context.getAll();
      expect(all).toEqual({ foo: 'bar', baz: 'qux' });
    });

    it('should return a copy, not the original object', () => {
      const context = createSimpleContext();
      context.set('foo', 'bar');

      const all = context.getAll();
      all.foo = 'modified';

      expect(context.get('foo')).toBe('bar');
    });

    it('should work with forked contexts', () => {
      const context = createSimpleContext();
      context.set('foo', 'parent');

      context.fork(() => {
        context.set('bar', 'child');
        const all = context.getAll();
        expect(all).toEqual({ foo: 'parent', bar: 'child' });
      });
    });
  });

  describe('keys method', () => {
    it('should return all keys', () => {
      const context = createSimpleContext();
      context.set('foo', 'bar');
      context.set('baz', 'qux');

      const keys = context.keys();
      expect(keys).toEqual(expect.arrayContaining(['foo', 'baz']));
      expect(keys.length).toBe(2);
    });

    it('should return empty array when no keys', () => {
      const context = createSimpleContext();
      expect(context.keys()).toEqual([]);
    });
  });

  describe('size method', () => {
    it('should return the number of entries', () => {
      const context = createSimpleContext();
      expect(context.size()).toBe(0);

      context.set('foo', 'bar');
      expect(context.size()).toBe(1);

      context.set('baz', 'qux');
      expect(context.size()).toBe(2);
    });

    it('should decrease when deleting keys', () => {
      const context = createSimpleContext();
      context.set('foo', 'bar');
      context.set('baz', 'qux');
      expect(context.size()).toBe(2);

      context.delete('foo');
      expect(context.size()).toBe(1);
    });
  });

  describe('validation', () => {
    it('should throw TypeError for non-string key in get', () => {
      const context = createSimpleContext();
      expect(() => context.get(123 as unknown as string)).toThrow(TypeError);
      expect(() => context.get(null as unknown as string)).toThrow(TypeError);
    });

    it('should throw TypeError for empty string key in get', () => {
      const context = createSimpleContext();
      expect(() => context.get('')).toThrow(TypeError);
    });

    it('should throw TypeError for non-string key in set', () => {
      const context = createSimpleContext();
      expect(() => context.set(123 as unknown as string, 'value')).toThrow(
        TypeError,
      );
    });

    it('should throw TypeError for empty string key in set', () => {
      const context = createSimpleContext();
      expect(() => context.set('', 'value')).toThrow(TypeError);
    });

    it('should throw TypeError for non-string key in delete', () => {
      const context = createSimpleContext();
      expect(() => context.delete(123 as unknown as string)).toThrow(TypeError);
    });

    it('should throw TypeError for non-string key in has', () => {
      const context = createSimpleContext();
      expect(() => context.has(123 as unknown as string)).toThrow(TypeError);
    });
  });

  describe('fork improvements', () => {
    it('should inherit properties from forked context', () => {
      const context = createSimpleContext();
      context.set('parentKey', 'parentValue');

      context.fork(() => {
        expect(context.get('parentKey')).toBe('parentValue');
        context.set('childKey', 'childValue');
        expect(context.get('childKey')).toBe('childValue');
      });

      expect(context.has('childKey')).toBe(false);
    });

    it('should not modify parent context from fork', () => {
      const context = createSimpleContext();
      context.set('key', 'original');

      context.fork(() => {
        context.set('key', 'modified');
        expect(context.get('key')).toBe('modified');
      });

      expect(context.get('key')).toBe('original');
    });

    it('should isolate nested forks (depth > 2)', () => {
      const context = createSimpleContext();
      context.set('level', 'root');

      context.fork(() => {
        context.set('level', 'child');

        context.fork(() => {
          context.set('level', 'grandchild');
          expect(context.get('level')).toBe('grandchild');
        });

        expect(context.get('level')).toBe('child');
      });

      expect(context.get('level')).toBe('root');
    });

    it('should not leak deleted keys from fork to parent', () => {
      const context = createSimpleContext();
      context.set('foo', 'parent');

      context.fork(() => {
        expect(context.has('foo')).toBe(true);
        context.delete('foo');
        expect(context.has('foo')).toBe(false);
      });

      expect(context.has('foo')).toBe(true);
      expect(context.get('foo')).toBe('parent');
    });
  });

  describe('edge cases', () => {
    it('should not report prototype keys via has()', () => {
      const context = createSimpleContext();
      expect(context.has('toString')).toBe(false);
      expect(context.has('hasOwnProperty')).toBe(false);
      expect(context.has('constructor')).toBe(false);
    });

    it('should not report prototype keys via has() inside a fork', () => {
      const context = createSimpleContext();
      context.fork(() => {
        expect(context.has('toString')).toBe(false);
        expect(context.has('constructor')).toBe(false);
      });
    });

    it('should distinguish undefined value from missing key', () => {
      const context = createSimpleContext();
      context.set('key', undefined);
      expect(context.has('key')).toBe(true);
      expect(context.get('key')).toBeUndefined();
    });

    it('should return a shallow copy from getAll (nested objects are shared)', () => {
      const context = createSimpleContext();
      const nested = { inner: 'original' };
      context.set('obj', nested);

      const all = context.getAll();
      (all.obj as { inner: string }).inner = 'mutated';

      const retrieved = context.get<{ inner: string }>('obj');
      expect(retrieved?.inner).toBe('mutated');
    });

    it('should handle concurrent fork callbacks without interference', async () => {
      const context = createSimpleContext();

      const [resultA, resultB] = await Promise.all([
        new Promise<string | undefined>((resolve) => {
          context.fork(() => {
            context.set('val', 'A');
            setTimeout(() => resolve(context.get<string>('val')), 50);
          });
        }),
        new Promise<string | undefined>((resolve) => {
          context.fork(() => {
            context.set('val', 'B');
            setTimeout(() => resolve(context.get<string>('val')), 50);
          });
        }),
      ]);

      expect(resultA).toBe('A');
      expect(resultB).toBe('B');
    });
  });
});
