import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    action: string;
    companyId?: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }) {
    await this.prisma.auditLog.create({
      data: {
        action: params.action,
        companyId: params.companyId,
        userId: params.userId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: params.metadata as object | undefined,
      },
    });
  }
}
