import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { QuestionBankController } from './question-bank.controller.js';
import { QuestionBankService } from './question-bank.service.js';
import { QuestionDuplicateDetectionService } from './question-duplicate-detection.service.js';
import { QuestionImportService } from './services/question-import.service.js';

@Module({
  imports: [AuthModule],
  controllers: [QuestionBankController],
  providers: [
    QuestionBankService,
    QuestionDuplicateDetectionService,
    QuestionImportService,
  ],
  exports: [
    QuestionBankService,
    QuestionDuplicateDetectionService,
    QuestionImportService,
  ],
})
export class QuestionBankModule {}
