import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { QuestionBankController } from './question-bank.controller.js';
import { QuestionBankService } from './question-bank.service.js';
import { QuestionDuplicateDetectionService } from './question-duplicate-detection.service.js';

@Module({
  imports: [AuthModule],
  controllers: [QuestionBankController],
  providers: [QuestionBankService, QuestionDuplicateDetectionService],
  exports: [QuestionBankService, QuestionDuplicateDetectionService],
})
export class QuestionBankModule {}
