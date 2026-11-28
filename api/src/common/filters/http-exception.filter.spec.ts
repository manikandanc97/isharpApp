import {
  BadRequestException,
  HttpStatus,
  UnauthorizedException,
  type ArgumentsHost,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AllExceptionsFilter } from './http-exception.filter.js';

function createMockHost() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method: 'POST', url: '/api/test' }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('preserves existing HttpException status codes and response payloads', () => {
    const { host, status, json } = createMockHost();
    filter.catch(new BadRequestException('Invalid payload'), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, message: 'Invalid payload' }),
    );
  });

  it('preserves UnauthorizedException without masking auth errors', () => {
    const { host, status } = createMockHost();
    filter.catch(new UnauthorizedException('Invalid credentials'), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
  });

  it('maps Prisma P2002 to 409 Conflict', () => {
    const { host, status, json } = createMockHost();
    filter.catch({ code: 'P2002', message: 'Unique constraint' }, host);
    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith({
      statusCode: 409,
      message: 'A record with this value already exists.',
    });
  });

  it('maps Prisma P2025 to 404 Not Found and P2003 to 400 Bad Request', () => {
    const notFound = createMockHost();
    filter.catch({ code: 'P2025' }, notFound.host);
    expect(notFound.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);

    const fkErr = createMockHost();
    filter.catch({ code: 'P2003' }, fkErr.host);
    expect(fkErr.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
  });

  it('maps Prisma connectivity errors (P1017) to 503 without leaking SQL', () => {
    const { host, status, json } = createMockHost();
    filter.catch({ code: 'P1017', message: 'postgres://secret@host' }, host);
    expect(status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(json).toHaveBeenCalledWith({
      statusCode: 503,
      message: 'Database service is temporarily unavailable.',
    });
  });

  it('maps unknown errors to 500 without leaking internal stack or SQL', () => {
    const { host, status, json } = createMockHost();
    filter.catch(new Error('SELECT * FROM secret_table failed'), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'An unexpected server error occurred.',
    });
  });
});
