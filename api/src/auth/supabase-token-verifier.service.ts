import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTVerifyGetKey,
  type JWTPayload,
} from 'jose';

@Injectable()
export class SupabaseTokenVerifier {
  private settings?: {
    issuer: string;
    audience: string;
    key: JWTVerifyGetKey;
    algorithms: string[];
  };

  constructor(private readonly config: ConfigService) {}

  async verify(token: string): Promise<JWTPayload> {
    const settings = this.getSettings();
    try {
      const { payload } = await jwtVerify(token, settings.key, {
        issuer: settings.issuer,
        audience: settings.audience,
        algorithms: settings.algorithms,
      });
      if (
        !payload.sub ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          payload.sub,
        )
      ) {
        throw new Error('Token subject is not a UUID');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private getSettings(): NonNullable<SupabaseTokenVerifier['settings']> {
    if (this.settings) return this.settings;

    const supabaseUrl = this.config
      .get<string>('SUPABASE_URL')
      ?.replace(/\/$/, '');
    if (!supabaseUrl) {
      throw new ServiceUnavailableException(
        'Authentication is not configured: SUPABASE_URL is missing',
      );
    }

    const issuer = `${supabaseUrl}/auth/v1`;
    const audience =
      this.config.get<string>('SUPABASE_JWT_AUDIENCE') ?? 'authenticated';
    const legacySecret = this.config.get<string>('SUPABASE_JWT_SECRET');

    if (legacySecret) {
      if (legacySecret.length < 32) {
        throw new ServiceUnavailableException(
          'Authentication is misconfigured: SUPABASE_JWT_SECRET is too short',
        );
      }
      const key = new TextEncoder().encode(legacySecret);
      this.settings = {
        issuer,
        audience,
        key: async () => key,
        algorithms: ['HS256'],
      };
    } else {
      this.settings = {
        issuer,
        audience,
        key: createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`)),
        algorithms: ['ES256', 'RS256'],
      };
    }
    return this.settings;
  }
}
