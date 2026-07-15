import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import {
  JobRole,
  MemberStatus,
  SystemRole,
} from '@prisma/client';

@Injectable()
export class CompanyService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  getCompany(companyId: string) {
    return this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscription: { include: { plan: true } },
      },
    });
  }

  listMembers(companyId: string) {
    return this.prisma.member.findMany({
      where: { companyId },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMember(
    companyId: string,
    adminUserId: string,
    dto: { email: string; name: string; jobRole: JobRole; password?: string },
  ) {
    const sub = await this.prisma.subscription.findUnique({
      where: { companyId },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.seatsUsed >= sub.seatLimit) {
      throw new ForbiddenException('SEAT_LIMIT_REACHED');
    }

    let user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      if (!user) {
        if (!dto.password) {
          throw new BadRequestException('Password required for new user');
        }
        const bcrypt = await import('bcrypt');
        user = await tx.user.create({
          data: {
            email: dto.email.toLowerCase(),
            name: dto.name,
            passwordHash: await bcrypt.hash(dto.password, 12),
          },
        });
      }

      const existingMember = await tx.member.findUnique({
        where: { userId_companyId: { userId: user.id, companyId } },
      });
      if (existingMember) {
        throw new BadRequestException('User already in organization');
      }

      const member = await tx.member.create({
        data: {
          userId: user.id,
          companyId,
          systemRole: SystemRole.MEMBER,
          jobRole: dto.jobRole,
          status: MemberStatus.ACTIVE,
        },
        include: { user: { select: { id: true, email: true, name: true } } },
      });

      await tx.subscription.update({
        where: { companyId },
        data: { seatsUsed: { increment: 1 } },
      });

      return member;
    });

    await this.audit.log({
      action: 'MEMBER_ADDED',
      companyId,
      userId: adminUserId,
      metadata: { memberId: result.id, email: dto.email },
    });

    return result;
  }

  async updateMember(
    companyId: string,
    memberId: string,
    dto: { jobRole?: JobRole; status?: MemberStatus; systemRole?: SystemRole },
  ) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, companyId },
    });
    if (!member) throw new NotFoundException('Member not found');

    if (
      member.systemRole === SystemRole.ADMIN &&
      dto.systemRole === SystemRole.MEMBER
    ) {
      const adminCount = await this.prisma.member.count({
        where: { companyId, systemRole: SystemRole.ADMIN, status: MemberStatus.ACTIVE },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot demote the only admin');
      }
    }

    return this.prisma.member.update({
      where: { id: memberId },
      data: dto,
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  async removeMember(companyId: string, memberId: string, adminUserId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, companyId },
    });
    if (!member) throw new NotFoundException('Member not found');

    if (member.systemRole === SystemRole.ADMIN) {
      const adminCount = await this.prisma.member.count({
        where: { companyId, systemRole: SystemRole.ADMIN, status: MemberStatus.ACTIVE },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the only admin');
      }
    }

    await this.prisma.$transaction([
      this.prisma.member.delete({ where: { id: memberId } }),
      this.prisma.subscription.update({
        where: { companyId },
        data: { seatsUsed: { decrement: 1 } },
      }),
    ]);

    await this.audit.log({
      action: 'MEMBER_REMOVED',
      companyId,
      userId: adminUserId,
      metadata: { memberId },
    });

    return { ok: true };
  }
}
