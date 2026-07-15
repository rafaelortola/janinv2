import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkItemStatus } from '@prisma/client';

const DEFAULT_COLUMNS: { name: string; status: WorkItemStatus; position: number }[] = [
  { name: 'Backlog', status: WorkItemStatus.BACKLOG, position: 0 },
  { name: 'To Do', status: WorkItemStatus.TODO, position: 1 },
  { name: 'In Progress', status: WorkItemStatus.IN_PROGRESS, position: 2 },
  { name: 'In Review', status: WorkItemStatus.IN_REVIEW, position: 3 },
  { name: 'Done', status: WorkItemStatus.DONE, position: 4 },
];

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  findAll(companyId: string) {
    return this.prisma.project.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, companyId },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(
    companyId: string,
    dto: { key: string; name: string; description?: string },
  ) {
    const key = dto.key.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          companyId,
          key,
          name: dto.name,
          description: dto.description,
        },
      });

      await tx.boardColumn.createMany({
        data: DEFAULT_COLUMNS.map((c) => ({ ...c, projectId: project.id })),
      });

      return project;
    });
  }

  async update(
    companyId: string,
    id: string,
    dto: { name?: string; description?: string; dorChecklist?: unknown; dodChecklist?: unknown },
  ) {
    await this.findOne(companyId, id);
    return this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        dorChecklist: dto.dorChecklist as object | undefined,
        dodChecklist: dto.dodChecklist as object | undefined,
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    await this.prisma.project.delete({ where: { id } });
    return { ok: true };
  }
}
