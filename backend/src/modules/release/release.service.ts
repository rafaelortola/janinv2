import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReleaseStatus } from '@prisma/client';

@Injectable()
export class ReleaseService {
  constructor(private prisma: PrismaService) {}

  list(companyId: string, projectId: string) {
    return this.prisma.release.findMany({
      where: { project: { id: projectId, companyId } },
      include: { _count: { select: { workItems: true, sprints: true } } },
      orderBy: { releaseDate: 'desc' },
    });
  }

  async create(
    companyId: string,
    projectId: string,
    dto: { version: string; name: string; description?: string; releaseDate?: string },
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
    });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.release.create({
      data: {
        projectId,
        version: dto.version,
        name: dto.name,
        description: dto.description,
        releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
      },
    });
  }

  async updateStatus(companyId: string, id: string, status: ReleaseStatus) {
    const release = await this.prisma.release.findFirst({
      where: { id, project: { companyId } },
    });
    if (!release) throw new NotFoundException('Release not found');
    return this.prisma.release.update({ where: { id }, data: { status } });
  }

  async timeline(companyId: string, projectId: string) {
    const releases = await this.list(companyId, projectId);
    const sprints = await this.prisma.sprint.findMany({
      where: { projectId, project: { companyId } },
      include: { release: true },
      orderBy: { startDate: 'asc' },
    });
    return { releases, sprints };
  }
}
