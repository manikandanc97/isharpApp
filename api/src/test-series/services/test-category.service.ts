import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dto/test-series.dto.js';

@Injectable()
export class TestCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories() {
    await this.ensureDefaultCategories();
    const categories = await this.prisma.testSeriesCategory.findMany({
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });

    const countByCategory = new Map<string, number>();

    if (typeof this.prisma.assessmentTest?.groupBy === 'function') {
      const [directGroups, legacyTests] = await Promise.all([
        this.prisma.assessmentTest.groupBy({
          by: ['categoryId'],
          where: { categoryId: { not: null } },
          _count: { _all: true },
        }),
        this.prisma.assessmentTest.findMany({
          where: { categoryId: null },
          select: { testSeries: { select: { categoryId: true } } },
        }),
      ]);

      for (const group of directGroups ?? []) {
        if (group.categoryId) {
          countByCategory.set(
            group.categoryId,
            (countByCategory.get(group.categoryId) ?? 0) + group._count._all,
          );
        }
      }
      for (const t of legacyTests ?? []) {
        const catId = t.testSeries?.categoryId;
        if (catId) {
          countByCategory.set(catId, (countByCategory.get(catId) ?? 0) + 1);
        }
      }
    } else {
      const tests = await this.prisma.assessmentTest.findMany({
        select: {
          id: true,
          categoryId: true,
          testSeries: { select: { categoryId: true } },
        },
      });
      for (const t of tests ?? []) {
        const catId = t.categoryId ?? t.testSeries?.categoryId;
        if (catId) {
          countByCategory.set(catId, (countByCategory.get(catId) ?? 0) + 1);
        }
      }
    }

    return categories.map((c) => ({
      ...c,
      testCount: countByCategory.get(c.id) ?? 0,
    }));
  }

  async createCategory(dto: CreateCategoryDto) {
    const trimmedName = dto.name?.trim() ?? '';
    if (!trimmedName) {
      throw new BadRequestException('Category name is required');
    }

    const duplicateByName = await this.prisma.testSeriesCategory.findFirst({
      where: { name: { equals: trimmedName, mode: 'insensitive' } },
    });
    if (duplicateByName) {
      throw new ConflictException(`Category "${trimmedName}" already exists`);
    }

    const baseSlug =
      dto.slug?.trim().toLowerCase() ||
      trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') ||
      `cat-${Date.now()}`;

    const existingSlug = await this.prisma.testSeriesCategory.findUnique({
      where: { slug: baseSlug },
    });
    const slug = existingSlug
      ? `${baseSlug}-${Date.now().toString().slice(-4)}`
      : baseSlug;

    const maxPos = await this.prisma.testSeriesCategory.aggregate({
      _max: { position: true },
    });

    return this.prisma.testSeriesCategory.create({
      data: {
        name: trimmedName,
        slug,
        description: dto.description?.trim() || null,
        position: dto.position ?? (maxPos._max.position ?? 0) + 1,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.testSeriesCategory.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    let nextName: string | undefined;
    if (dto.name !== undefined) {
      const trimmed = dto.name.trim();
      if (!trimmed) {
        throw new BadRequestException('Category name cannot be empty');
      }
      const duplicate = await this.prisma.testSeriesCategory.findFirst({
        where: {
          id: { not: id },
          name: { equals: trimmed, mode: 'insensitive' },
        },
      });
      if (duplicate) {
        throw new ConflictException(`Category "${trimmed}" already exists`);
      }
      nextName = trimmed;
    }

    return this.prisma.testSeriesCategory.update({
      where: { id },
      data: {
        ...(nextName ? { name: nextName } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.position !== undefined ? { position: dto.position } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async deleteCategory(id: string, moveToCategoryId?: string) {
    const existing = await this.prisma.testSeriesCategory.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    const [directTestCount, seriesCount, legacyTestCount] = await Promise.all([
      this.prisma.assessmentTest.count({ where: { categoryId: id } }),
      this.prisma.testSeries.count({ where: { categoryId: id } }),
      this.prisma.assessmentTest.count({
        where: { categoryId: null, testSeries: { categoryId: id } },
      }),
    ]);

    const totalTests = directTestCount + legacyTestCount;

    if ((totalTests > 0 || seriesCount > 0) && !moveToCategoryId) {
      throw new BadRequestException(
        `Cannot delete category "${existing.name}" because it contains ${totalTests} test(s). Please move them to another category first.`,
      );
    }

    if (moveToCategoryId) {
      if (moveToCategoryId === id) {
        throw new BadRequestException(
          'Target category must be different from the deleted category',
        );
      }
      const target = await this.prisma.testSeriesCategory.findUnique({
        where: { id: moveToCategoryId },
      });
      if (!target) {
        throw new NotFoundException('Target category not found');
      }

      return this.prisma.$transaction(async (tx) => {
        await tx.assessmentTest.updateMany({
          where: {
            OR: [
              { categoryId: id },
              { categoryId: null, testSeries: { categoryId: id } },
            ],
          },
          data: { categoryId: moveToCategoryId },
        });
        await tx.testSeries.updateMany({
          where: { categoryId: id },
          data: { categoryId: moveToCategoryId },
        });
        return tx.testSeriesCategory.delete({ where: { id } });
      });
    }

    return this.prisma.testSeriesCategory.delete({ where: { id } });
  }

  private async ensureDefaultCategories() {
    const count = await this.prisma.testSeriesCategory.count();
    if (count > 0) return;

    const defaults = [
      { name: 'Class 11', slug: 'class-11', position: 1 },
      { name: 'Class 12', slug: 'class-12', position: 2 },
      { name: 'Repeater', slug: 'repeater', position: 3 },
      { name: 'Full Syllabus', slug: 'full-syllabus', position: 4 },
      { name: 'Mock Tests', slug: 'mock-tests', position: 5 },
    ];

    for (const d of defaults) {
      await this.prisma.testSeriesCategory.upsert({
        where: { slug: d.slug },
        update: {},
        create: d,
      });
    }
  }
}
