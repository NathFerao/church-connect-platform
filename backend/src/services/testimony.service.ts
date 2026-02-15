import { Testimony } from '@prisma/client';
import { TestimonyRepository } from '../repositories/testimony.repository';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { PaginationParams, PaginatedResponse } from '../types';
import { paginatedResponse } from '../utils/helpers';

export class TestimonyService {
  private testimonyRepository: TestimonyRepository;

  constructor() {
    this.testimonyRepository = new TestimonyRepository();
  }

  async getTestimonies(
    churchId: string,
    userRole: string,
    params: PaginationParams
  ): Promise<PaginatedResponse<Testimony>> {
    const includeUnpublished = ['CHURCH_ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(userRole);

    const testimonies = await this.testimonyRepository.findByChurch(
      churchId,
      params,
      includeUnpublished
    );
    const total = await this.testimonyRepository.countByChurch(
      churchId,
      includeUnpublished
    );

    return paginatedResponse(testimonies, params, total);
  }

  async getFeatured(churchId: string): Promise<Testimony[]> {
    return this.testimonyRepository.findFeatured(churchId);
  }

  async getTestimonyById(id: string, churchId: string): Promise<Testimony> {
    const testimony = await this.testimonyRepository.findById(id);

    if (!testimony) {
      throw new NotFoundError('Testimony not found');
    }

    if (testimony.churchId !== churchId) {
      throw new ForbiddenError('Access denied');
    }

    return testimony;
  }

  async createTestimony(
    data: {
      title: string;
      content: string;
      category?: string;
      imageUrl?: string;
      videoUrl?: string;
      isPublished?: boolean;
    },
    authorId: string,
    churchId: string
  ): Promise<Testimony> {
    return this.testimonyRepository.create({
      ...data,
      authorId,
      churchId,
    });
  }

  async updateTestimony(
    id: string,
    data: Partial<Testimony>,
    userId: string,
    userRole: string,
    churchId: string
  ): Promise<Testimony> {
    const testimony = await this.getTestimonyById(id, churchId);

    const canEdit =
      testimony!.authorId === userId ||
      ['CHURCH_ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(userRole);

    if (!canEdit) {
      throw new ForbiddenError('You do not have permission to edit this testimony');
    }

    return this.testimonyRepository.update(id, data);
  }

  async deleteTestimony(
    id: string,
    userId: string,
    userRole: string,
    churchId: string
  ): Promise<void> {
    const testimony = await this.getTestimonyById(id, churchId);

    const canDelete =
      testimony!.authorId === userId ||
      ['CHURCH_ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(userRole);

    if (!canDelete) {
      throw new ForbiddenError('You do not have permission to delete this testimony');
    }

    await this.testimonyRepository.delete(id);
  }
}
