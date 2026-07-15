import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SprintStatus, WorkItemStatus } from '@prisma/client';

@Injectable()
export class SprintService {
  constructor(private prisma: PrismaService) {}

  private async assertProject(companyId: string, projectId: string) {
    const p = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
    });
    if (!p) throw new NotFoundException('Project not found');
    return p;
  }

  list(companyId: string, projectId: string) {
    return this.assertProject(companyId, projectId).then(() =>
      this.prisma.sprint.findMany({
        where: { projectId },
        include: { _count: { select: { workItems: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async create(
    companyId: string,
    projectId: string,
    dto: { name: string; goal?: string; startDate?: string; endDate?: string; releaseId?: string },
  ) {
    await this.assertProject(companyId, projectId);
    return this.prisma.sprint.create({
      data: {
        projectId,
        name: dto.name,
        goal: dto.goal,
        releaseId: dto.releaseId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async activate(companyId: string, sprintId: string) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
      include: { project: true },
    });
    if (!sprint || sprint.project.companyId !== companyId) {
      throw new NotFoundException('Sprint not found');
    }

    await this.prisma.sprint.updateMany({
      where: { projectId: sprint.projectId, status: SprintStatus.ACTIVE },
      data: { status: SprintStatus.CLOSED },
    });

    return this.prisma.sprint.update({
      where: { id: sprintId },
      data: { status: SprintStatus.ACTIVE },
    });
  }

  async close(companyId: string, sprintId: string) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
      include: { project: true },
    });
    if (!sprint || sprint.project.companyId !== companyId) {
      throw new NotFoundException('Sprint not found');
    }
    return this.prisma.sprint.update({
      where: { id: sprintId },
      data: { status: SprintStatus.CLOSED },
    });
  }

  async setCapacity(
    companyId: string,
    sprintId: string,
    items: { memberId: string; storyPoints?: number; hours?: number }[],
  ) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
      include: { project: true },
    });
    if (!sprint || sprint.project.companyId !== companyId) {
      throw new NotFoundException('Sprint not found');
    }

    await this.prisma.sprintCapacity.deleteMany({ where: { sprintId } });
    await this.prisma.sprintCapacity.createMany({
      data: items.map((i) => ({
        sprintId,
        memberId: i.memberId,
        storyPoints: i.storyPoints ?? 0,
        hours: i.hours ?? 0,
      })),
    });
    return { ok: true };
  }

  async metrics(companyId: string, sprintId: string) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        project: true,
        workItems: true,
        capacities: true,
      },
    });
    if (!sprint || sprint.project.companyId !== companyId) {
      throw new NotFoundException('Sprint not found');
    }

    const totalPoints = sprint.workItems.reduce(
      (s, i) => s + (i.storyPoints ?? 0),
      0,
    );
    const donePoints = sprint.workItems
      .filter((i) => i.status === WorkItemStatus.DONE)
      .reduce((s, i) => s + (i.storyPoints ?? 0), 0);

    const capacityPoints = sprint.capacities.reduce(
      (s, c) => s + c.storyPoints,
      0,
    );

    const closedSprints = await this.prisma.sprint.findMany({
      where: { projectId: sprint.projectId, status: SprintStatus.CLOSED },
      orderBy: { endDate: 'desc' },
      take: 3,
      include: { workItems: true },
    });

    const velocity =
      closedSprints.length === 0
        ? 0
        : closedSprints.reduce(
            (sum, sp) =>
              sum +
              sp.workItems
                .filter((w) => w.status === WorkItemStatus.DONE)
                .reduce((s, w) => s + (w.storyPoints ?? 0), 0),
            0,
          ) / closedSprints.length;

    const burndown = this.buildBurndown(sprint.workItems, sprint.startDate, sprint.endDate);
    const burnup = burndown.map((d, idx) => ({
      date: d.date,
      completed: burndown
        .slice(0, idx + 1)
        .reduce((s, x) => s + (totalPoints - x.remaining), 0),
    }));

    return {
      sprint: {
        id: sprint.id,
        name: sprint.name,
        status: sprint.status,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
      },
      totalPoints,
      donePoints,
      remainingPoints: totalPoints - donePoints,
      capacityPoints,
      velocity: Math.round(velocity * 10) / 10,
      burndown,
      burnup,
      definitionOfReady: sprint.project.dorChecklist,
      definitionOfDone: sprint.project.dodChecklist,
    };
  }

  private buildBurndown(
    items: { storyPoints: number | null; status: WorkItemStatus; updatedAt: Date }[],
    start?: Date | null,
    end?: Date | null,
  ) {
    const total = items.reduce((s, i) => s + (i.storyPoints ?? 0), 0);
    const startDate = start ?? new Date();
    const endDate = end ?? new Date(Date.now() + 14 * 86400000);
    const days = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000),
    );
    const done = items
      .filter((i) => i.status === WorkItemStatus.DONE)
      .reduce((s, i) => s + (i.storyPoints ?? 0), 0);

    return Array.from({ length: days + 1 }, (_, i) => {
      const date = new Date(startDate.getTime() + i * 86400000);
      const ideal = total - (total / days) * i;
      const remaining = Math.max(0, total - done * (i / days));
      return {
        date: date.toISOString().slice(0, 10),
        ideal: Math.round(ideal * 10) / 10,
        remaining: Math.round(remaining * 10) / 10,
      };
    });
  }
}
