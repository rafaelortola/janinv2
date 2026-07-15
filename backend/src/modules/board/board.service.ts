import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BoardService {
  constructor(private prisma: PrismaService) {}

  async getBoard(companyId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
    });
    if (!project) throw new NotFoundException('Project not found');

    const columns = await this.prisma.boardColumn.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
      include: {
        workItems: {
          where: { companyId },
          include: {
            assignee: { select: { id: true, name: true } },
            labels: { include: { label: true } },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    return { project, columns };
  }

  async saveQuickFilter(
    userId: string,
    projectId: string,
    name: string,
    query: object,
  ) {
    return this.prisma.quickFilter.create({
      data: { userId, projectId, name, query: query as object },
    });
  }

  listQuickFilters(userId: string, projectId: string) {
    return this.prisma.quickFilter.findMany({
      where: { userId, projectId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
