import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { PlansModule } from './modules/plans/plans.module';
import { CompanyModule } from './modules/company/company.module';
import { ProjectModule } from './modules/project/project.module';
import { WorkItemModule } from './modules/work-item/work-item.module';
import { BoardModule } from './modules/board/board.module';
import { SprintModule } from './modules/sprint/sprint.module';
import { ReleaseModule } from './modules/release/release.module';
import { QaModule } from './modules/qa/qa.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    PlansModule,
    CompanyModule,
    ProjectModule,
    WorkItemModule,
    BoardModule,
    SprintModule,
    ReleaseModule,
    QaModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
