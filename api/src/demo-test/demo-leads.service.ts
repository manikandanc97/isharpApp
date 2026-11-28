import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DemoLeadFollowUpStatus, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { maskPhoneNumber, normalizeIndianMobile } from './demo-test-phone.helper.js';

export interface ListDemoLeadsQuery {
  page?: number;
  limit?: number;
  query?: string;
  followUpStatus?: string;
  consent?: string;
  from?: string;
  to?: string;
}

export interface UpdateDemoLeadInput {
  normalizedPhone?: string;
  marketingConsent?: boolean;
  followUpStatus?: string;
  adminNotes?: string | null;
}

const VALID_FOLLOW_UP_STATUSES: DemoLeadFollowUpStatus[] = [
  'NEW',
  'CONTACTED',
  'INTERESTED',
  'JOINED',
  'NOT_INTERESTED',
];

@Injectable()
export class DemoLeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalLeads, todayLeads, completedTests, pendingFollowUp] =
      await Promise.all([
        this.prisma.demoLead.count(),
        this.prisma.demoLead.count({
          where: { createdAt: { gte: startOfToday } },
        }),
        this.prisma.demoAttempt.count({
          where: {
            isPreview: false,
            leadId: { not: null },
            status: { in: ['SUBMITTED', 'EXPIRED'] },
          },
        }),
        this.prisma.demoLead.count({
          where: { followUpStatus: 'NEW' },
        }),
      ]);

    return {
      totalLeads,
      todayLeads,
      completedTests,
      pendingFollowUp,
    };
  }

  async listLeads(filters: ListDemoLeadsQuery) {
    const page = Math.max(1, Number(filters.page) || 1);
    // Cap page size at 50 to prevent unauthorized bulk extraction
    const limit = Math.min(50, Math.max(1, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.DemoLeadWhereInput = {};

    const rawQuery = filters.query?.trim();
    if (rawQuery) {
      const digitsOnly = rawQuery.replace(/\D/g, '');
      where.normalizedPhone = {
        contains: digitsOnly || rawQuery,
      };
    }

    const status = filters.followUpStatus?.trim().toUpperCase();
    if (status && status !== 'ALL') {
      if (!VALID_FOLLOW_UP_STATUSES.includes(status as DemoLeadFollowUpStatus)) {
        throw new BadRequestException('Invalid follow-up status filter');
      }
      where.followUpStatus = status as DemoLeadFollowUpStatus;
    }

    const consent = filters.consent?.trim().toUpperCase();
    if (consent === 'GRANTED') {
      where.marketingConsent = true;
    } else if (consent === 'NOT_GRANTED') {
      where.marketingConsent = false;
    }

    if (filters.from || filters.to) {
      const dateRange: Prisma.DateTimeFilter = {};
      if (filters.from) {
        const fromDate = new Date(filters.from);
        if (!Number.isNaN(fromDate.getTime())) {
          dateRange.gte = fromDate;
        }
      }
      if (filters.to) {
        const toDate = new Date(filters.to);
        if (!Number.isNaN(toDate.getTime())) {
          toDate.setHours(23, 59, 59, 999);
          dateRange.lte = toDate;
        }
      }
      if (Object.keys(dateRange).length > 0) {
        where.lastAccessAt = dateRange;
      }
    }

    const [total, items] = await Promise.all([
      this.prisma.demoLead.count({ where }),
      this.prisma.demoLead.findMany({
        where,
        orderBy: [{ lastAccessAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true,
          normalizedPhone: true,
          verificationMethod: true,
          isVerified: true,
          verifiedAt: true,
          firstAccessAt: true,
          lastAccessAt: true,
          totalAttempts: true,
          latestScore: true,
          latestMaxMarks: true,
          latestPercentage: true,
          marketingConsent: true,
          consentTimestamp: true,
          followUpStatus: true,
          adminNotes: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getLeadAttempts(leadId: string) {
    const lead = await this.prisma.demoLead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        normalizedPhone: true,
        verificationMethod: true,
        marketingConsent: true,
        followUpStatus: true,
        adminNotes: true,
        totalAttempts: true,
        firstAccessAt: true,
        lastAccessAt: true,
      },
    });
    if (!lead) {
      throw new NotFoundException('Demo lead not found');
    }

    const attempts = await this.prisma.demoAttempt.findMany({
      where: { leadId, isPreview: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        status: true,
        subjectMode: true,
        languageMode: true,
        questionCount: true,
        durationMinutes: true,
        maxMarks: true,
        totalScore: true,
        correctCount: true,
        incorrectCount: true,
        unansweredCount: true,
        accuracyPercentage: true,
        timeSpentSeconds: true,
        startedAt: true,
        submittedAt: true,
      },
    });

    return { lead, attempts };
  }

  async updateLeadFollowUp(
    leadId: string,
    input: UpdateDemoLeadInput,
    actorUserId?: string | null,
  ) {
    const existing = await this.prisma.demoLead.findUnique({
      where: { id: leadId },
    });
    if (!existing) {
      throw new NotFoundException('Demo lead not found');
    }

    const data: Prisma.DemoLeadUpdateInput = {};

    if (input.normalizedPhone !== undefined) {
      const normalized = normalizeIndianMobile(input.normalizedPhone);
      if (normalized !== existing.normalizedPhone) {
        const duplicate = await this.prisma.demoLead.findUnique({
          where: { normalizedPhone: normalized },
          select: { id: true },
        });
        if (duplicate && duplicate.id !== leadId) {
          throw new BadRequestException(
            'Another demo lead already exists with this mobile number.',
          );
        }
        data.normalizedPhone = normalized;
      }
    }

    if (input.marketingConsent !== undefined) {
      const consent = Boolean(input.marketingConsent);
      data.marketingConsent = consent;
      data.consentTimestamp = consent
        ? (existing.consentTimestamp ?? new Date())
        : null;
    }

    if (input.followUpStatus !== undefined) {
      const normalizedStatus = String(input.followUpStatus).trim().toUpperCase();
      if (
        !VALID_FOLLOW_UP_STATUSES.includes(
          normalizedStatus as DemoLeadFollowUpStatus,
        )
      ) {
        throw new BadRequestException('Invalid follow-up status');
      }
      data.followUpStatus = normalizedStatus as DemoLeadFollowUpStatus;
    }

    if (input.adminNotes !== undefined) {
      data.adminNotes =
        typeof input.adminNotes === 'string' && input.adminNotes.trim()
          ? input.adminNotes.trim().slice(0, 2000)
          : null;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.demoLead.update({
        where: { id: leadId },
        data,
      });

      await tx.demoAdminAuditLog.create({
        data: {
          actorUserId: actorUserId ?? null,
          action: 'UPDATE_DEMO_LEAD',
          details: {
            leadId,
            phoneMasked: maskPhoneNumber(existing.normalizedPhone),
            followUpStatus: next.followUpStatus,
            hasNotes: Boolean(next.adminNotes),
          } as never,
        },
      });

      return next;
    });

    return updated;
  }

  async deleteLead(leadId: string, actorUserId?: string | null) {
    const existing = await this.prisma.demoLead.findUnique({
      where: { id: leadId },
      select: { id: true, normalizedPhone: true },
    });
    if (!existing) {
      throw new NotFoundException('Demo lead not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.demoLead.delete({
        where: { id: leadId },
      });

      await tx.demoAdminAuditLog.create({
        data: {
          actorUserId: actorUserId ?? null,
          action: 'DELETE_DEMO_LEAD',
          details: {
            leadId,
            phoneMasked: maskPhoneNumber(existing.normalizedPhone),
          } as never,
        },
      });
    });

    return { deleted: true, id: leadId };
  }
}
