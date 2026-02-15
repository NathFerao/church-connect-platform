import { Announcement } from '@prisma/client';
import prisma from '../config/database';
import { BaseRepository } from './base.repository';
import { PaginationParams } from '../types';

export class AnnouncementRepository extends BaseRepository<Announcement> {
  constructor() {
    super(prisma.announcement);
  }

  async findByChurch(
    churchId: string,
    params?: PaginationParams,
    includeUnpublished = false
  ): Promise<Announcement[]> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params || {};

    const where: any = { churchId };

    if (!includeUnpublished) {
      where.isPublished = true;
      where.OR = [
        { publishAt: { lte: new Date() } },
        { publishAt: null },
      ];
      where.AND = [
        {
          OR: [
            { expiresAt: { gte: new Date() } },
            { expiresAt: null },
          ],
        },
      ];
    }

    return prisma.announcement.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        _count: { select: { comments: true } },
      },
    });
  }

  async countByChurch(churchId: string, includeUnpublished = false): Promise<number> {
    const where: any = { churchId };
    if (!includeUnpublished) where.isPublished = true;
    return prisma.announcement.count({ where });
  }
}