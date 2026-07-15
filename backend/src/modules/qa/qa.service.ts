import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Priority,
  TestExecutionStatus,
  WorkItemType,
} from '@prisma/client';

@Injectable()
export class QaService {
  constructor(private prisma: PrismaService) {}

  listTestPlans(companyId: string, projectId: string) {
    return this.prisma.testPlan.findMany({
      where: { companyId, projectId },
      include: { _count: { select: { testCases: true } } },
    });
  }

  createTestPlan(
    companyId: string,
    projectId: string,
    dto: { name: string; description?: string },
  ) {
    return this.prisma.testPlan.create({
      data: { companyId, projectId, ...dto },
    });
  }

  listTestCases(testPlanId: string, companyId: string) {
    return this.prisma.testCase.findMany({
      where: { testPlanId, testPlan: { companyId } },
      include: {
        story: { select: { id: true, key: true, title: true } },
        executions: {
          orderBy: { executedAt: 'desc' },
          take: 1,
          include: { executor: { select: { name: true } } },
        },
      },
    });
  }

  createTestCase(
    companyId: string,
    testPlanId: string,
    dto: {
      storyId: string;
      title: string;
      steps?: string;
      expectedResult?: string;
      priority?: Priority;
    },
  ) {
    return this.prisma.testCase.create({
      data: {
        testPlanId,
        storyId: dto.storyId,
        title: dto.title,
        steps: dto.steps,
        expectedResult: dto.expectedResult,
        priority: dto.priority ?? Priority.MEDIUM,
      },
      include: { story: { select: { id: true, key: true, title: true } } },
    });
  }

  async executeTestCase(
    companyId: string,
    testCaseId: string,
    executorId: string,
    dto: {
      status: TestExecutionStatus;
      notes?: string;
      evidence?: { filename: string; url: string; content?: string }[];
    },
  ) {
    const testCase = await this.prisma.testCase.findFirst({
      where: { id: testCaseId, testPlan: { companyId } },
      include: { story: true, testPlan: true },
    });
    if (!testCase) throw new NotFoundException('Test case not found');

    const execution = await this.prisma.testExecution.create({
      data: {
        testCaseId,
        executorId,
        status: dto.status,
        notes: dto.notes,
        evidences: dto.evidence
          ? { create: dto.evidence }
          : undefined,
      },
      include: { evidences: true },
    });

    if (dto.status === TestExecutionStatus.FAIL) {
      const project = await this.prisma.project.findUnique({
        where: { id: testCase.testPlan.projectId },
      });
      const last = await this.prisma.workItem.findFirst({
        where: { projectId: testCase.testPlan.projectId },
        orderBy: { sequence: 'desc' },
      });
      const sequence = (last?.sequence ?? 0) + 1;

      await this.prisma.workItem.create({
        data: {
          companyId,
          projectId: testCase.testPlan.projectId,
          parentId: testCase.storyId,
          type: WorkItemType.DEFECT,
          sequence,
          key: `${project!.key}-${sequence}`,
          title: `Defect: ${testCase.title}`,
          description: dto.notes,
          sourceExecutionId: execution.id,
        },
      });
    }

    return execution;
  }

  async traceability(companyId: string, projectId: string) {
    const stories = await this.prisma.workItem.findMany({
      where: { companyId, projectId, type: WorkItemType.STORY },
      include: {
        testCases: {
          include: {
            executions: {
              orderBy: { executedAt: 'desc' },
              take: 1,
              include: { defect: true },
            },
          },
        },
      },
    });

    return stories.map((story) => ({
      story: { id: story.id, key: story.key, title: story.title },
      testCases: story.testCases.map((tc) => ({
        id: tc.id,
        title: tc.title,
        lastExecution: tc.executions[0] ?? null,
        defect: tc.executions[0]?.defect ?? null,
      })),
      coverage: story.testCases.length > 0,
    }));
  }

  async coverage(companyId: string, projectId: string) {
    const stories = await this.prisma.workItem.count({
      where: { companyId, projectId, type: WorkItemType.STORY },
    });
    const storiesWithTests = await this.prisma.workItem.count({
      where: {
        companyId,
        projectId,
        type: WorkItemType.STORY,
        testCases: { some: {} },
      },
    });
    const totalCases = await this.prisma.testCase.count({
      where: { testPlan: { companyId, projectId } },
    });
    const executedCases = await this.prisma.testCase.count({
      where: {
        testPlan: { companyId, projectId },
        executions: { some: {} },
      },
    });

    return {
      storyCoverage: stories ? Math.round((storiesWithTests / stories) * 100) : 0,
      executionCoverage: totalCases
        ? Math.round((executedCases / totalCases) * 100)
        : 0,
      stories,
      storiesWithTests,
      totalCases,
      executedCases,
    };
  }
}
