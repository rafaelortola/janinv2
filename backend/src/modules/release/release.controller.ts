import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReleaseService } from './release.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { ReleaseStatus } from '@prisma/client';

class CreateReleaseDto {
  @IsString()
  version!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  releaseDate?: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class ReleaseController {
  constructor(private release: ReleaseService) {}

  @Get('projects/:projectId/releases')
  list(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.release.list(user.companyId, projectId);
  }

  @Get('projects/:projectId/timeline')
  timeline(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.release.timeline(user.companyId, projectId);
  }

  @Post('projects/:projectId/releases')
  create(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateReleaseDto,
  ) {
    return this.release.create(user.companyId, projectId, dto);
  }

  @Patch('releases/:id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('status') status: ReleaseStatus,
  ) {
    return this.release.updateStatus(user.companyId, id, status);
  }
}
