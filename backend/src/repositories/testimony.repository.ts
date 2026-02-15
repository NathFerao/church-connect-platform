import { Testimony } from '@prisma/client';
import prisma from '../config/database';
import { BaseRepository } from './base.repository';
import { PaginationParams } from '../types';

export class TestimonyRepository extends BaseRepository<Testimony> {
  constructor() {
    super(prisma.testimony);
  }

  async findByChurch(
    churchId: string,
    params?: PaginationParams,
    includeUnpublished = false
  ): Promise<Testimony[]> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params || {};

    const where: any = { churchId };
    if (!includeUnpublished) {
      where.isPublished = true;
    }

    return prisma.testimony.findMany({
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

  async findFeatured(churchId: string): Promise<Testimony[]> {
    return prisma.testimony.findMany({
      where: {
        churchId,
        isPublished: true,
        isFeatured: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });
  }

  async countByChurch(churchId: string, includeUnpublished = false): Promise<number> {
    const where: any = { churchId };
    if (!includeUnpublished) where.isPublished = true;
    return prisma.testimony.count({ where });
  }
}