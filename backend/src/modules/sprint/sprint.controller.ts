import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsArray, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SprintService } from './sprint.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

class CreateSprintDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  releaseId?: string;
}

class CapacityItemDto {
  @IsUUID()
  memberId!: string;

  @IsOptional()
  storyPoints?: number;

  @IsOptional()
  hours?: number;
}

class CapacityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CapacityItemDto)
  items!: CapacityItemDto[];
}

@Controller()
@UseGuards(JwtAuthGuard)
export class SprintController {
  constructor(private sprint: SprintService) {}

  @Get('projects/:projectId/sprints')
  list(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.sprint.list(user.companyId, projectId);
  }

  @Post('projects/:projectId/sprints')
  create(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateSprintDto,
  ) {
    return this.sprint.create(user.companyId, projectId, dto);
  }

  @Patch('sprints/:id/activate')
  activate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sprint.activate(user.companyId, id);
  }

  @Patch('sprints/:id/close')
  close(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sprint.close(user.companyId, id);
  }

  @Post('sprints/:id/capacity')
  capacity(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CapacityDto,
  ) {
    return this.sprint.setCapacity(user.companyId, id, dto.items);
  }

  @Get('sprints/:id/metrics')
  metrics(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sprint.metrics(user.companyId, id);
  }
}
