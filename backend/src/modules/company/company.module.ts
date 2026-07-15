import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [CompanyController],
  providers: [CompanyService, AuditService],
})
export class CompanyModule {}
