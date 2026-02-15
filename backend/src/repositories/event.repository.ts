import { Event } from '@prisma/client';
import prisma from '../config/database';
import { BaseRepository } from './base.repository';
import { PaginationParams } from '../types';

export class EventRepository extends BaseRepository<Event> {
  constructor() {
    super(prisma.event);
  }

  async findByChurch(
    churchId: string,
    params?: PaginationParams
  ): Promise<Event[]> {
    const { page = 1, limit = 10, sortBy = 'startTime', sortOrder = 'asc' } = params || {};

    return prisma.event.findMany({
      where: { churchId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
      include: {
        _count: { select: { registrations: true } },
      },
    });
  }

  async findUpcoming(churchId: string): Promise<Event[]> {
    return prisma.event.findMany({
      where: {
        churchId,
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: 'asc' },
      take: 10,
      include: {
        _count: { select: { registrations: true } },
      },
    });
  }

  async registerUser(eventId: string, userId: string): Promise<void> {
    await prisma.eventRegistration.create({
      data: { eventId, userId },
    });
  }

  async unregisterUser(eventId: string, userId: string): Promise<void> {
    await prisma.eventRegistration.delete({
      where: {
        eventId_userId: { eventId, userId },
      },
    });
  }

  async isUserRegistered(eventId: string, userId: string): Promise<boolean> {
    const registration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: { eventId, userId },
      },
    });
    return !!registration;
  }
}
