import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsObject, IsString } from 'class-validator';
import { BoardService } from './board.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

class QuickFilterDto {
  @IsString()
  name!: string;

  @IsObject()
  query!: object;
}

@Controller('projects/:projectId/board')
@UseGuards(JwtAuthGuard)
export class BoardController {
  constructor(private board: BoardService) {}

  @Get()
  getBoard(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.board.getBoard(user.companyId, projectId);
  }

  @Get('quick-filters')
  quickFilters(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.board.listQuickFilters(user.userId, projectId);
  }

  @Post('quick-filters')
  saveQuickFilter(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: QuickFilterDto,
  ) {
    return this.board.saveQuickFilter(user.userId, projectId, dto.name, dto.query);
  }
}
