import { PrayerRequest } from '@prisma/client';
import { PrayerRequestRepository } from '../repositories/prayer.repository';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import { PaginationParams, PaginatedResponse } from '../types';
import { paginatedResponse } from '../utils/helpers';

export class PrayerService {
  private prayerRepository: PrayerRequestRepository;

  constructor() {
    this.prayerRepository = new PrayerRequestRepository();
  }

  async getPrayerRequests(
    churchId: string,
    userId: string,
    params: PaginationParams
  ): Promise<PaginatedResponse<PrayerRequest>> {
    const prayers = await this.prayerRepository.findByChurch(churchId, userId, params);
    const total = await this.prayerRepository.count({ 
      churchId,
      OR: [
        { isPrivate: false },
        { requesterId: userId },
      ],
    });

    return paginatedResponse(prayers, params, total);
  }

  async createPrayerRequest(
    data: {
      title: string;
      description: string;
      category?: string;
      isAnonymous?: boolean;
      isPrivate?: boolean;
    },
    requesterId: string,
    churchId: string
  ): Promise<PrayerRequest> {
    return this.prayerRepository.create({
      ...data,
      requesterId,
      churchId,
      status: 'ACTIVE',
    });
  }

  async updatePrayerRequest(
    id: string,
    data: Partial<PrayerRequest>,
    userId: string,
    churchId: string
  ): Promise<PrayerRequest> {
    const prayer = await this.prayerRepository.findById(id);

    if (!prayer || prayer.churchId !== churchId) {
      throw new NotFoundError('Prayer request not found');
    }

    if (prayer.requesterId !== userId) {
      throw new ForbiddenError('Only the requester can update this prayer request');
    }

    return this.prayerRepository.update(id, data);
  }

  async markAsAnswered(id: string, userId: string, churchId: string): Promise<PrayerRequest> {
    return this.updatePrayerRequest(
      id,
      { status: 'ANSWERED', answeredAt: new Date() },
      userId,
      churchId
    );
  }

  async addPrayer(prayerRequestId: string, userId: string, churchId: string): Promise<void> {
    const prayer = await this.prayerRepository.findById(prayerRequestId);

    if (!prayer || prayer.churchId !== churchId) {
      throw new NotFoundError('Prayer request not found');
    }

    const hasPrayed = await this.prayerRepository.hasPrayed(prayerRequestId, userId);
    
    if (hasPrayed) {
      throw new ConflictError('You have already prayed for this request');
    }

    await this.prayerRepository.addPrayer(prayerRequestId, userId);
  }

  async removePrayer(prayerRequestId: string, userId: string, churchId: string): Promise<void> {
    const prayer = await this.prayerRepository.findById(prayerRequestId);

    if (!prayer || prayer.churchId !== churchId) {
      throw new NotFoundError('Prayer request not found');
    }

    await this.prayerRepository.removePrayer(prayerRequestId, userId);
  }
}