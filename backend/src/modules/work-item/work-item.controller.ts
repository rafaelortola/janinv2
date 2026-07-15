import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { WorkItemService } from './work-item.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import {
  Priority,
  WorkItemStatus,
  WorkItemType,
} from '@prisma/client';

class CreateWorkItemDto {
  @IsEnum(WorkItemType)
  type!: WorkItemType;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsUUID()
  sprintId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  storyPoints?: number;

  @IsOptional()
  @IsString()
  acceptanceCriteria?: string;
}

class MoveWorkItemDto {
  @IsOptional()
  @IsEnum(WorkItemStatus)
  status?: WorkItemStatus;

  @IsOptional()
  @IsUUID()
  columnId?: string;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsUUID()
  sprintId?: string | null;
}

class CommentDto {
  @IsString()
  body!: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class WorkItemController {
  constructor(private workItems: WorkItemService) {}

  @Get('projects/:projectId/work-items')
  list(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Query('type') type?: WorkItemType,
    @Query('status') status?: WorkItemStatus,
    @Query('sprintId') sprintId?: string,
    @Query('assigneeId') assigneeId?: string,
  ) {
    return this.workItems.list(user.companyId, projectId, {
      type,
      status,
      sprintId,
      assigneeId,
    });
  }

  @Get('projects/:projectId/work-items/tree')
  tree(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.workItems.tree(user.companyId, projectId);
  }

  @Get('work-items/:id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.workItems.findOne(user.companyId, id);
  }

  @Post('projects/:projectId/work-items')
  create(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateWorkItemDto,
  ) {
    return this.workItems.create(user.companyId, projectId, user.userId, dto);
  }

  @Patch('work-items/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: Partial<CreateWorkItemDto> & { status?: WorkItemStatus },
  ) {
    return this.workItems.update(user.companyId, id, user.userId, dto);
  }

  @Patch('work-items/:id/move')
  move(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: MoveWorkItemDto,
  ) {
    return this.workItems.move(user.companyId, id, user.userId, dto);
  }

  @Delete('work-items/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.workItems.remove(user.companyId, id);
  }

  @Post('work-items/:id/comments')
  comment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CommentDto,
  ) {
    return this.workItems.addComment(user.companyId, id, user.userId, dto.body);
  }
}
