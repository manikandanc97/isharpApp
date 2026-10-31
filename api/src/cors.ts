type CorsOriginCallback = (error: Error | null, allow?: boolean) => void;

export function getAllowedFrontendOrigins(
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const origins = new Set<string>([
    parseOrigin(
      env.FRONTEND_LOCAL_ORIGIN ?? 'http://localhost:3000',
      'FRONTEND_LOCAL_ORIGIN',
    ),
  ]);
  const productionOrigin = env.FRONTEND_PRODUCTION_ORIGIN?.trim();
  if (productionOrigin) {
    origins.add(parseOrigin(productionOrigin, 'FRONTEND_PRODUCTION_ORIGIN'));
  }
  return [...origins];
}

export function createCorsOptions(env: NodeJS.ProcessEnv = process.env) {
  const allowedOrigins = new Set(getAllowedFrontendOrigins(env));

  return {
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 86_400,
    origin(
      this: void,
      origin: string | undefined,
      callback: CorsOriginCallback,
    ) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin is not allowed by CORS'), false);
    },
  };
}

function parseOrigin(value: string, name: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(`${name} must be a valid HTTP(S) origin`);
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(`${name} must be an HTTP(S) origin without a path`);
  }
  return url.origin;
}
