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
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { SystemRole, JobRole, MemberStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

class AddMemberDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsEnum(JobRole)
  jobRole!: JobRole;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}

class UpdateMemberDto {
  @IsOptional()
  @IsEnum(JobRole)
  jobRole?: JobRole;

  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;
}

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyController {
  constructor(private company: CompanyService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.company.getCompany(user.companyId);
  }

  @Get('me/members')
  members(@CurrentUser() user: AuthUser) {
    return this.company.listMembers(user.companyId);
  }

  @Post('me/members')
  @Roles(SystemRole.ADMIN)
  addMember(@CurrentUser() user: AuthUser, @Body() dto: AddMemberDto) {
    return this.company.addMember(user.companyId, user.userId, dto);
  }

  @Patch('me/members/:id')
  @Roles(SystemRole.ADMIN)
  updateMember(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.company.updateMember(user.companyId, id, dto);
  }

  @Delete('me/members/:id')
  @Roles(SystemRole.ADMIN)
  removeMember(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.company.removeMember(user.companyId, id, user.userId);
  }
}
