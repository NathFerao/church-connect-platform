import { Event } from '@prisma/client';
import { EventRepository } from '../repositories/event.repository';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import { PaginationParams, PaginatedResponse } from '../types';
import { paginatedResponse } from '../utils/helpers';
import prisma from '../config/database';

export class EventService {
  private eventRepository: EventRepository;

  constructor() {
    this.eventRepository = new EventRepository();
  }

  async getEvents(
    churchId: string,
    params: PaginationParams
  ): Promise<PaginatedResponse<Event>> {
    const events = await this.eventRepository.findByChurch(churchId, params);
    const total = await this.eventRepository.count({ churchId });

    return paginatedResponse(events, params, total);
  }

  async getUpcomingEvents(churchId: string): Promise<Event[]> {
    return this.eventRepository.findUpcoming(churchId);
  }

  async getEventById(id: string, churchId: string): Promise<Event> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.churchId !== churchId) {
      throw new ForbiddenError('Access denied');
    }

    return event;
  }

  async createEvent(
    data: {
      title: string;
      description: string;
      type?: string;
      location?: string;
      startTime: Date;
      endTime: Date;
      isAllDay?: boolean;
      isPublic?: boolean;
      maxCapacity?: number;
    },
    churchId: string
  ): Promise<Event> {
    return this.eventRepository.create({
      ...data,
      churchId,
    });
  }

  async updateEvent(
    id: string,
    data: Partial<Event>,
    churchId: string
  ): Promise<Event> {
    await this.getEventById(id, churchId);
    return this.eventRepository.update(id, data);
  }

  async deleteEvent(id: string, churchId: string): Promise<void> {
    await this.getEventById(id, churchId);
    await this.eventRepository.delete(id);
  }

  async registerForEvent(
    eventId: string,
    userId: string,
    churchId: string
  ): Promise<void> {
    const event = await this.getEventById(eventId, churchId);

    const isRegistered = await this.eventRepository.isUserRegistered(eventId, userId);
    if (isRegistered) {
      throw new ConflictError('Already registered for this event');
    }

    if (event!.maxCapacity) {
      const registrationCount = await prisma.eventRegistration.count({
        where: { eventId },
      });
      if (registrationCount >= event!.maxCapacity) {
        throw new ConflictError('Event is full');
      }
    }

    await this.eventRepository.registerUser(eventId, userId);
  }

  async unregisterFromEvent(
    eventId: string,
    userId: string,
    churchId: string
  ): Promise<void> {
    await this.getEventById(eventId, churchId);
    await this.eventRepository.unregisterUser(eventId, userId);
  }
}