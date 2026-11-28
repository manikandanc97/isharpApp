import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

interface PrismaLikeError {
  code?: string;
  message?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();
    const request = ctx.getRequest<{ method?: string; url?: string }>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resBody = exception.getResponse();
      const payload =
        typeof resBody === 'string'
          ? { statusCode: status, message: resBody }
          : resBody;
      response.status(status).json(payload);
      return;
    }

    const prismaErr = exception as PrismaLikeError | null;
    const code = prismaErr && typeof prismaErr === 'object' ? prismaErr.code : undefined;

    if (code === 'P2002') {
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: 'A record with this value already exists.',
      });
      return;
    }

    if (code === 'P2025') {
      response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'The requested record was not found.',
      });
      return;
    }

    if (code === 'P2003') {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Operation violates a related record constraint.',
      });
      return;
    }

    if (code === 'P1001' || code === 'P1002' || code === 'P1017') {
      this.logger.error(
        `Database connectivity error (${code}) on ${request?.method ?? 'UNKNOWN'} ${request?.url ?? ''}`,
      );
      response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Database service is temporarily unavailable.',
      });
      return;
    }

    const safeMessage =
      exception instanceof Error ? exception.message : 'Unknown error';
    this.logger.error(
      `Unhandled exception on ${request?.method ?? 'UNKNOWN'} ${request?.url ?? ''}: ${safeMessage}`,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected server error occurred.',
    });
  }
}
