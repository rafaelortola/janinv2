import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { slugify } from '../../common/constants';
import {
  JobRole,
  MemberStatus,
  SubscriptionStatus,
  SystemRole,
} from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private audit: AuditService,
  ) {}

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private signAccess(payload: Record<string, string>) {
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: 900,
    });
  }

  private async createRefreshToken(userId: string) {
    const raw = crypto.randomBytes(48).toString('hex');
    const days = this.config.get<number>('JWT_REFRESH_EXPIRES_DAYS', 7);
    const expiresAt = new Date(Date.now() + days * 86400000);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(raw),
        expiresAt,
      },
    });
    return raw;
  }

  async registerCompany(dto: {
    companyName: string;
    name: string;
    email: string;
    password: string;
    planId: string;
    jobRole?: JobRole;
  }) {
    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan) throw new UnauthorizedException('Invalid plan');

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new UnauthorizedException('Email already registered');

    let slug = slugify(dto.companyName);
    const slugTaken = await this.prisma.company.findUnique({ where: { slug } });
    if (slugTaken) slug = `${slug}-${Date.now().toString(36)}`;

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          name: dto.name,
          passwordHash,
        },
      });

      const company = await tx.company.create({
        data: { name: dto.companyName, slug },
      });

      await tx.subscription.create({
        data: {
          companyId: company.id,
          planId: plan.id,
          seatLimit: plan.seatLimit,
          seatsUsed: 1,
          status: SubscriptionStatus.TRIAL,
          expiresAt: new Date(Date.now() + 14 * 86400000),
        },
      });

      const member = await tx.member.create({
        data: {
          userId: user.id,
          companyId: company.id,
          systemRole: SystemRole.ADMIN,
          jobRole: dto.jobRole ?? JobRole.PO,
          status: MemberStatus.ACTIVE,
        },
      });

      return { user, company, member };
    });

    const accessToken = this.signAccess({
      sub: result.user.id,
      email: result.user.email,
      companyId: result.company.id,
      memberId: result.member.id,
      systemRole: SystemRole.ADMIN,
    });
    const refreshToken = await this.createRefreshToken(result.user.id);

    await this.audit.log({
      action: 'REGISTER_COMPANY',
      companyId: result.company.id,
      userId: result.user.id,
      metadata: { planId: dto.planId },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      company: {
        id: result.company.id,
        name: result.company.name,
        slug: result.company.slug,
      },
    };
  }

  private normalizeLoginEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    if (normalized === 'admin') return 'admin@admin.com';
    return normalized;
  }

  async login(email: string, password: string, ip?: string) {
    const loginEmail = this.normalizeLoginEmail(email);
    const user = await this.prisma.user.findUnique({
      where: { email: loginEmail },
      include: {
        members: {
          where: { status: MemberStatus.ACTIVE },
          include: { company: true },
        },
      },
    });

    if (!user) {
      await this.audit.log({ action: 'LOGIN_FAILED', ipAddress: ip, metadata: { email } });
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await this.audit.log({ action: 'LOGIN_FAILED', userId: user.id, ipAddress: ip });
      throw new UnauthorizedException('Invalid credentials');
    }

    const member = user.members[0];
    if (!member) throw new UnauthorizedException('No active organization');

    const accessToken = this.signAccess({
      sub: user.id,
      email: user.email,
      companyId: member.companyId,
      memberId: member.id,
      systemRole: member.systemRole,
    });
    const refreshToken = await this.createRefreshToken(user.id);

    await this.audit.log({
      action: 'LOGIN_SUCCESS',
      companyId: member.companyId,
      userId: user.id,
      ipAddress: ip,
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name },
      company: {
        id: member.company.id,
        name: member.company.name,
        slug: member.company.slug,
      },
      systemRole: member.systemRole,
      jobRole: member.jobRole,
    };
  }

  async refresh(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            members: {
              where: { status: MemberStatus.ACTIVE },
              take: 1,
            },
          },
        },
      },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const member = stored.user.members[0];
    if (!member) throw new UnauthorizedException('No active organization');

    const accessToken = this.signAccess({
      sub: stored.user.id,
      email: stored.user.email,
      companyId: member.companyId,
      memberId: member.id,
      systemRole: member.systemRole,
    });
    const refreshToken = await this.createRefreshToken(stored.user.id);

    return { accessToken, refreshToken };
  }

  async logout(rawToken: string, userId?: string) {
    if (rawToken) {
      const tokenHash = this.hashToken(rawToken);
      await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
    }
    if (userId) {
      await this.audit.log({ action: 'LOGOUT', userId });
    }
  }

  async me(userId: string, companyId: string) {
    const member = await this.prisma.member.findUnique({
      where: { userId_companyId: { userId, companyId } },
      include: {
        user: true,
        company: { include: { subscription: { include: { plan: true } } } },
      },
    });
    if (!member) throw new UnauthorizedException('Member not found');
    return {
      user: {
        id: member.user.id,
        email: member.user.email,
        name: member.user.name,
      },
      company: member.company,
      systemRole: member.systemRole,
      jobRole: member.jobRole,
      subscription: member.company.subscription,
    };
  }
}
