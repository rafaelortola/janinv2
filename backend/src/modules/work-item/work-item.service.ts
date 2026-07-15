import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WORK_ITEM_PARENT_RULES } from '../../common/constants';
import {
  Priority,
  WorkItemStatus,
  WorkItemType,
} from '@prisma/client';

@Injectable()
export class WorkItemService {
  constructor(private prisma: PrismaService) {}

  private async assertProject(companyId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  private validateParent(type: WorkItemType, parentType?: WorkItemType) {
    const allowed = WORK_ITEM_PARENT_RULES[type];
    if (allowed === null && !parentType) return;
    if (allowed === null && parentType) {
      throw new BadRequestException(`${type} cannot have a parent`);
    }
    if (!parentType && allowed && allowed.length > 0) {
      throw new BadRequestException(`${type} requires a parent`);
    }
    if (parentType && allowed && !allowed.includes(parentType)) {
      throw new BadRequestException(
        `${type} cannot be child of ${parentType}`,
      );
    }
  }

  async list(
    companyId: string,
    projectId: string,
    filters?: {
      type?: WorkItemType;
      status?: WorkItemStatus;
      sprintId?: string;
      assigneeId?: string;
      parentId?: string;
    },
  ) {
    await this.assertProject(companyId, projectId);
    return this.prisma.workItem.findMany({
      where: {
        companyId,
        projectId,
        ...(filters?.type && { type: filters.type }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.sprintId && { sprintId: filters.sprintId }),
        ...(filters?.assigneeId && { assigneeId: filters.assigneeId }),
        ...(filters?.parentId !== undefined && { parentId: filters.parentId }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        labels: { include: { label: true } },
        children: { select: { id: true, key: true, title: true, type: true } },
      },
      orderBy: [{ position: 'asc' }, { sequence: 'asc' }],
    });
  }

  async tree(companyId: string, projectId: string) {
    const items = await this.list(companyId, projectId);
    const roots = items.filter((i) => !i.parentId);
    const byParent = new Map<string, typeof items>();
    for (const item of items) {
      if (item.parentId) {
        const list = byParent.get(item.parentId) ?? [];
        list.push(item);
        byParent.set(item.parentId, list);
      }
    }

    const build = (node: (typeof items)[0]): object => ({
      ...node,
      children: (byParent.get(node.id) ?? []).map(build),
    });

    return roots.map(build);
  }

  async findOne(companyId: string, id: string) {
    const item = await this.prisma.workItem.findFirst({
      where: { id, companyId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        labels: { include: { label: true } },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        history: { orderBy: { createdAt: 'desc' }, take: 50 },
        parent: { select: { id: true, key: true, title: true, type: true } },
        testCases: true,
      },
    });
    if (!item) throw new NotFoundException('Work item not found');
    return item;
  }

  async create(
    companyId: string,
    projectId: string,
    userId: string,
    dto: {
      type: WorkItemType;
      title: string;
      description?: string;
      parentId?: string;
      priority?: Priority;
      assigneeId?: string;
      sprintId?: string;
      releaseId?: string;
      storyPoints?: number;
      acceptanceCriteria?: string;
    },
  ) {
    const project = await this.assertProject(companyId, projectId);

    let parentType: WorkItemType | undefined;
    if (dto.parentId) {
      const parent = await this.prisma.workItem.findFirst({
        where: { id: dto.parentId, companyId, projectId },
      });
      if (!parent) throw new NotFoundException('Parent not found');
      parentType = parent.type;
    }
    this.validateParent(dto.type, parentType);

    const last = await this.prisma.workItem.findFirst({
      where: { projectId },
      orderBy: { sequence: 'desc' },
    });
    const sequence = (last?.sequence ?? 0) + 1;
    const key = `${project.key}-${sequence}`;

    const item = await this.prisma.workItem.create({
      data: {
        companyId,
        projectId,
        parentId: dto.parentId,
        type: dto.type,
        sequence,
        key,
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? Priority.MEDIUM,
        assigneeId: dto.assigneeId,
        sprintId: dto.sprintId,
        releaseId: dto.releaseId,
        storyPoints: dto.storyPoints,
        acceptanceCriteria: dto.acceptanceCriteria,
        status: WorkItemStatus.BACKLOG,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    await this.prisma.workItemHistory.create({
      data: {
        workItemId: item.id,
        userId,
        field: 'created',
        newValue: key,
      },
    });

    return item;
  }

  async update(
    companyId: string,
    id: string,
    userId: string,
    dto: Partial<{
      title: string;
      description: string;
      status: WorkItemStatus;
      priority: Priority;
      assigneeId: string | null;
      sprintId: string | null;
      releaseId: string | null;
      storyPoints: number | null;
      acceptanceCriteria: string;
      parentId: string | null;
    }>,
  ) {
    const existing = await this.findOne(companyId, id);
    const data: Record<string, unknown> = { ...dto };

    if (dto.parentId !== undefined) {
      let parentType: WorkItemType | undefined;
      if (dto.parentId) {
        const parent = await this.prisma.workItem.findFirst({
          where: { id: dto.parentId, companyId: existing.companyId },
        });
        if (!parent) throw new NotFoundException('Parent not found');
        parentType = parent.type;
      }
      this.validateParent(existing.type, parentType);
    }

    const item = await this.prisma.workItem.update({
      where: { id },
      data,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    for (const [field, newValue] of Object.entries(dto)) {
      const oldValue = (existing as Record<string, unknown>)[field];
      if (oldValue !== newValue) {
        await this.prisma.workItemHistory.create({
          data: {
            workItemId: id,
            userId,
            field,
            oldValue: oldValue != null ? String(oldValue) : null,
            newValue: newValue != null ? String(newValue) : null,
          },
        });
      }
    }

    return item;
  }

  async move(
    companyId: string,
    id: string,
    userId: string,
    dto: {
      status?: WorkItemStatus;
      columnId?: string;
      position?: number;
      sprintId?: string | null;
    },
  ) {
    const existing = await this.findOne(companyId, id);
    const update: Record<string, unknown> = {};

    if (dto.status) update.status = dto.status;
    if (dto.columnId) update.columnId = dto.columnId;
    if (dto.position !== undefined) update.position = dto.position;
    if (dto.sprintId !== undefined) update.sprintId = dto.sprintId;

    if (dto.status && !dto.columnId) {
      const col = await this.prisma.boardColumn.findFirst({
        where: { projectId: existing.projectId, status: dto.status },
      });
      if (col) update.columnId = col.id;
    }

    return this.update(companyId, id, userId, update as Parameters<WorkItemService['update']>[3]);
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    await this.prisma.workItem.delete({ where: { id } });
    return { ok: true };
  }

  async addComment(companyId: string, workItemId: string, userId: string, body: string) {
    await this.findOne(companyId, workItemId);
    return this.prisma.comment.create({
      data: { workItemId, userId, body },
      include: { user: { select: { id: true, name: true } } },
    });
  }
}
