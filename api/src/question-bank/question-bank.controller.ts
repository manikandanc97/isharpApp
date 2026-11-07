import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth-user.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { QuestionBankService } from './question-bank.service.js';

@Controller('api/admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class QuestionBankController {
  constructor(private readonly bank: QuestionBankService) {}
  @Get('questions')
  questions(
    @Query('query') query?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('subject') subject?: string,
    @Query('difficulty') difficulty?: string,
    @Query('chapterId') chapterId?: string,
  ) {
    return this.bank.listQuestions({
      query,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      subjectCode: subject,
      difficulty,
      chapterId,
    });
  }
  @Post('questions') createQuestion(
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    return this.bank.saveQuestion(req.user.profileId, body);
  }
  @Post('questions/import') importQuestions(
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    return this.bank.importQuestions(req.user.profileId, body);
  }
  @Post('questions/import/preflight') importPreflight(@Body() body: unknown) {
    return this.bank.importPreflight(body);
  }
  @Delete('questions/:id')
  deleteQuestion(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.bank.deleteQuestion(id);
  }
  @Get('mock-tests') mockTests() {
    return this.bank.listMockTests();
  }
  @Post('mock-tests') createMockTest(
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    return this.bank.createMockTest(req.user.profileId, body);
  }
  @Post('mock-tests/:id/questions') setQuestions(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
  ) {
    return this.bank.setMockTestQuestions(id, body);
  }
  @Post('question-media')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  upload(
    @UploadedFile()
    file?: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    },
  ) {
    return this.bank.uploadImage(file);
  }
}
