import { Announcement } from '@prisma/client';
import { AnnouncementRepository } from '../repositories/announcement.repository';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { PaginationParams, PaginatedResponse } from '../types';
import { paginatedResponse } from '../utils/helpers';

export class AnnouncementService {
  private announcementRepository: AnnouncementRepository;

  constructor() {
    this.announcementRepository = new AnnouncementRepository();
  }

  async getAnnouncements(
    churchId: string,
    _userId: string,
    userRole: string,
    params: PaginationParams
  ): Promise<PaginatedResponse<Announcement>> {
    const includeUnpublished = ['CHURCH_ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(userRole);

    const announcements = await this.announcementRepository.findByChurch(
      churchId,
      params,
      includeUnpublished
    );
    const total = await this.announcementRepository.countByChurch(
      churchId,
      includeUnpublished
    );

    return paginatedResponse(announcements, params, total);
  }

  async getAnnouncementById(id: string, churchId: string): Promise<Announcement> {
    const announcement = await this.announcementRepository.findById(id);

    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }

    if (announcement.churchId !== churchId) {
      throw new ForbiddenError('Access denied');
    }

    return announcement;
  }

  async createAnnouncement(
    data: {
      title: string;
      content: string;
      priority?: string;
      imageUrl?: string;
      isPublished?: boolean;
      publishAt?: Date;
      expiresAt?: Date;
    },
    authorId: string,
    churchId: string
  ): Promise<Announcement> {
    return this.announcementRepository.create({
      ...data,
      authorId,
      churchId,
    });
  }

  async updateAnnouncement(
    id: string,
    data: Partial<Announcement>,
    userId: string,
    userRole: string,
    churchId: string
  ): Promise<Announcement> {
    // getAnnouncementById throws if null, so after this line
    // announcement is guaranteed to exist.
    const announcement = await this.getAnnouncementById(id, churchId);

    const canEdit =
      announcement!.authorId === userId ||
      ['CHURCH_ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(userRole);

    if (!canEdit) {
      throw new ForbiddenError('You do not have permission to edit this announcement');
    }

    return this.announcementRepository.update(id, data);
  }

  async deleteAnnouncement(
    id: string,
    userId: string,
    userRole: string,
    churchId: string
  ): Promise<void> {
    const announcement = await this.getAnnouncementById(id, churchId);

    const canDelete =
      announcement!.authorId === userId ||
      ['CHURCH_ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(userRole);

    if (!canDelete) {
      throw new ForbiddenError('You do not have permission to delete this announcement');
    }

    await this.announcementRepository.delete(id);
  }
}
