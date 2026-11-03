import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { QuestionBankController } from './question-bank.controller.js';
import { QuestionBankService } from './question-bank.service.js';
@Module({
  imports: [AuthModule],
  controllers: [QuestionBankController],
  providers: [QuestionBankService],
})
export class QuestionBankModule {}
