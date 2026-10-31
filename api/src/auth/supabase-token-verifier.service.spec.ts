import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseTokenVerifier } from './supabase-token-verifier.service.js';

describe('SupabaseTokenVerifier configuration', () => {
  it('allows the application to start without optional auth configuration', () => {
    expect(
      () => new SupabaseTokenVerifier(new ConfigService({})),
    ).not.toThrow();
  });

  it('fails closed on protected requests when SUPABASE_URL is missing', async () => {
    const verifier = new SupabaseTokenVerifier(new ConfigService({}));
    await expect(verifier.verify('token')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
