import { TimeoutError, withTimeout } from './with-timeout';

describe('withTimeout', () => {
  it('resolves with the underlying value when it settles before the timeout', async () => {
    const result = await withTimeout(Promise.resolve('done'), 100, 'quick op');
    expect(result).toBe('done');
  });

  it('rejects with a TimeoutError when the promise never settles in time', async () => {
    const neverResolves = new Promise<string>(() => {});

    await expect(withTimeout(neverResolves, 20, 'slow op')).rejects.toThrow(TimeoutError);
  });

  it('propagates the original rejection when the promise rejects before the timeout', async () => {
    const failing = Promise.reject(new Error('boom'));

    await expect(withTimeout(failing, 100, 'failing op')).rejects.toThrow('boom');
  });
});
