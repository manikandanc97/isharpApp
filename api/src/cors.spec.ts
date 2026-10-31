import { createCorsOptions, getAllowedFrontendOrigins } from './cors.js';

describe('CORS configuration', () => {
  const env = {
    FRONTEND_LOCAL_ORIGIN: 'http://localhost:3000',
    FRONTEND_PRODUCTION_ORIGIN: 'https://academy.example.com',
  };

  it('allows only the configured local and production origins', () => {
    expect(getAllowedFrontendOrigins(env)).toEqual([
      'http://localhost:3000',
      'https://academy.example.com',
    ]);
  });

  it.each([undefined, 'http://localhost:3000', 'https://academy.example.com'])(
    'allows trusted or non-browser origin %s',
    async (origin) => {
      const options = createCorsOptions(env);
      await expect(checkOrigin(options.origin, origin)).resolves.toBe(true);
    },
  );

  it('rejects an unconfigured browser origin', async () => {
    const options = createCorsOptions(env);
    await expect(
      checkOrigin(options.origin, 'https://attacker.example'),
    ).rejects.toThrow('not allowed');
  });

  it('rejects malformed production origins at startup', () => {
    expect(() =>
      createCorsOptions({
        FRONTEND_LOCAL_ORIGIN: 'http://localhost:3000',
        FRONTEND_PRODUCTION_ORIGIN: 'https://academy.example.com/path',
      }),
    ).toThrow('without a path');
  });
});

function checkOrigin(
  originHandler: (
    this: void,
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => void,
  origin: string | undefined,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    originHandler(origin, (error, allow) => {
      if (error) reject(error);
      else resolve(Boolean(allow));
    });
  });
}
