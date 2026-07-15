import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QaService } from './qa.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Priority, TestExecutionStatus } from '@prisma/client';

class CreateTestPlanDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class CreateTestCaseDto {
  @IsUUID()
  storyId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  steps?: string;

  @IsOptional()
  @IsString()
  expectedResult?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;
}

class EvidenceDto {
  @IsString()
  filename!: string;

  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  content?: string;
}

class ExecuteDto {
  @IsEnum(TestExecutionStatus)
  status!: TestExecutionStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvidenceDto)
  evidence?: EvidenceDto[];
}

@Controller()
@UseGuards(JwtAuthGuard)
export class QaController {
  constructor(private qa: QaService) {}

  @Get('projects/:projectId/test-plans')
  listPlans(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.qa.listTestPlans(user.companyId, projectId);
  }

  @Post('projects/:projectId/test-plans')
  createPlan(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTestPlanDto,
  ) {
    return this.qa.createTestPlan(user.companyId, projectId, dto);
  }

  @Get('test-plans/:id/cases')
  listCases(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.qa.listTestCases(id, user.companyId);
  }

  @Post('test-plans/:id/cases')
  createCase(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateTestCaseDto,
  ) {
    return this.qa.createTestCase(user.companyId, id, dto);
  }

  @Post('test-cases/:id/executions')
  execute(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ExecuteDto,
  ) {
    return this.qa.executeTestCase(user.companyId, id, user.userId, dto);
  }

  @Get('projects/:projectId/traceability')
  traceability(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.qa.traceability(user.companyId, projectId);
  }

  @Get('projects/:projectId/qa/coverage')
  coverage(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.qa.coverage(user.companyId, projectId);
  }
}
