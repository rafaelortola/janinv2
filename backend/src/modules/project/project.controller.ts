import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString, Matches } from 'class-validator';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

class CreateProjectDto {
  @IsString()
  @Matches(/^[A-Za-z0-9]+$/)
  key!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private project: ProjectService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.project.findAll(user.companyId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.project.findOne(user.companyId, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProjectDto) {
    return this.project.create(user.companyId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.project.update(user.companyId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.project.remove(user.companyId, id);
  }
}
