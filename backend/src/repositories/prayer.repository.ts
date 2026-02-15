import { PrayerRequest, Prayer } from '@prisma/client';
import prisma from '../config/database';
import { BaseRepository } from './base.repository';
import { PaginationParams } from '../types';

export class PrayerRequestRepository extends BaseRepository<PrayerRequest> {
  constructor() {
    super(prisma.prayerRequest);
  }

  async findByChurch(
    churchId: string,
    userId: string,
    params?: PaginationParams
  ): Promise<PrayerRequest[]> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params || {};

    return prisma.prayerRequest.findMany({
      where: {
        churchId,
        OR: [
          { isPrivate: false },
          { requesterId: userId },
        ],
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        _count: { select: { prayers: true, comments: true } },
      },
    });
  }

  async addPrayer(prayerRequestId: string, userId: string): Promise<Prayer> {
    return prisma.prayer.create({ data: { prayerRequestId, userId } });
  }

  async removePrayer(prayerRequestId: string, userId: string): Promise<void> {
    await prisma.prayer.delete({
      where: {
        prayerRequestId_userId: { prayerRequestId, userId },
      },
    });
  }

  async hasPrayed(prayerRequestId: string, userId: string): Promise<boolean> {
    const prayer = await prisma.prayer.findUnique({
      where: {
        prayerRequestId_userId: { prayerRequestId, userId },
      },
    });
    return !!prayer;
  }
}