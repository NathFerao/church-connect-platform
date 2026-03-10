import { Event } from '@prisma/client';
import { EventRepository } from '../repositories/event.repository';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import { PaginationParams, PaginatedResponse } from '../types';
import { paginatedResponse } from '../utils/helpers';
import prisma from '../config/database';
import { randomUUID } from 'crypto';

function pad(n: number) { return String(n).padStart(2, '0'); }
function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

interface RecurrenceInput {
  type: 'weekly' | 'custom';
  weekDays?: number[];
  weeksCount?: number;
  customDates?: string[];
}

interface CreateEventData {
  title: string;
  description: string;
  type?: string;
  location?: string | null;
  startTime: Date | string;
  endTime: Date | string;
  isAllDay?: boolean;
  isPublic?: boolean;
  maxCapacity?: number | null;
  recurrence?: RecurrenceInput;
}

export class EventService {
  private eventRepository: EventRepository;

  constructor() {
    this.eventRepository = new EventRepository();
  }

  async getEvents(
    churchId: string,
    params: PaginationParams,
    userId?: string
  ): Promise<PaginatedResponse<Event>> {
    const events = await this.eventRepository.findByChurch(churchId, params);
    const total = await this.eventRepository.count({ churchId });

    let eventsWithRegistration = events;
    if (userId) {
      eventsWithRegistration = await Promise.all(
        events.map(async (event) => {
          const isRegistered = await this.eventRepository.isUserRegistered(event.id, userId);
          return { ...event, isRegistered };
        })
      );
    }
    return paginatedResponse(eventsWithRegistration, params, total);
  }

  async getUpcomingEvents(churchId: string): Promise<Event[]> {
    return this.eventRepository.findUpcoming(churchId);
  }

  async getEventById(id: string, churchId: string): Promise<Event> {
    const event = await this.eventRepository.findById(id);
    if (!event) throw new NotFoundError('Event not found');
    if (event.churchId !== churchId) throw new ForbiddenError('Access denied');
    return event;
  }

  async createEvent(
    data: CreateEventData,
    churchId: string
  ): Promise<{ event: Event; seriesCount: number }> {
    const { recurrence, ...eventData } = data;
    const startTime = new Date(eventData.startTime);
    const endTime = new Date(eventData.endTime);
    const duration = endTime.getTime() - startTime.getTime();

    if (!recurrence) {
      const event = await this.eventRepository.create({ ...eventData, startTime, endTime, churchId });
      return { event, seriesCount: 1 };
    }

    const recurrenceGroupId = randomUUID();
    let dates: Date[] = [];

    if (recurrence.type === 'weekly') {
      const weekDays = recurrence.weekDays ?? [];
      const weeksCount = recurrence.weeksCount ?? 4;
      const sunday = new Date(startTime);
      sunday.setDate(startTime.getDate() - startTime.getDay());
      sunday.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      for (let week = 0; week < weeksCount; week++) {
        for (const day of weekDays) {
          const d = new Date(sunday);
          d.setDate(sunday.getDate() + day + week * 7);
          if (d >= startTime) dates.push(new Date(d));
        }
      }
    } else if (recurrence.type === 'custom') {
      const customDates = recurrence.customDates ?? [];
      const startKey = toDateKey(startTime);
      const allKeys = Array.from(new Set([startKey, ...customDates])).sort();
      dates = allKeys.map(key => {
        const d = new Date(key);
        d.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
        return d;
      });
    }

    if (dates.length === 0) {
      const event = await this.eventRepository.create({ ...eventData, startTime, endTime, churchId });
      return { event, seriesCount: 1 };
    }

    const events = await prisma.$transaction(
      dates.map((date, index) =>
        prisma.event.create({
          data: {
            title: String(eventData.title),
            description: String(eventData.description),
            type: (eventData.type as any) ?? 'OTHER',
            location: eventData.location ?? null,
            isAllDay: eventData.isAllDay ?? false,
            isPublic: eventData.isPublic ?? false,
            maxCapacity: eventData.maxCapacity ?? null,
            startTime: date,
            endTime: new Date(date.getTime() + duration),
            churchId,
            recurrenceGroupId,
            recurrenceIndex: index + 1,
          },
        })
      )
    );

    return { event: events[0], seriesCount: events.length };
  }

  async updateEvent(id: string, data: Partial<Event>, churchId: string): Promise<Event> {
    await this.getEventById(id, churchId);
    return this.eventRepository.update(id, data);
  }

  async deleteEvent(id: string, churchId: string): Promise<void> {
    await this.getEventById(id, churchId);
    await this.eventRepository.delete(id);
  }

  async deleteEventSeries(recurrenceGroupId: string, churchId: string): Promise<number> {
    const sample = await prisma.event.findFirst({ where: { recurrenceGroupId, churchId } });
    if (!sample) throw new NotFoundError('Series not found or access denied');
    const { count } = await prisma.event.deleteMany({ where: { recurrenceGroupId, churchId } });
    return count;
  }

  async registerForEvent(eventId: string, userId: string, churchId: string): Promise<void> {
    const event = await this.getEventById(eventId, churchId);
    const isRegistered = await this.eventRepository.isUserRegistered(eventId, userId);
    if (isRegistered) throw new ConflictError('Already registered for this event');
    if (event.maxCapacity) {
      const count = await prisma.eventRegistration.count({ where: { eventId } });
      if (count >= event.maxCapacity) throw new ConflictError('Event is full');
    }
    await this.eventRepository.registerUser(eventId, userId);
  }

  async unregisterFromEvent(eventId: string, userId: string, churchId: string): Promise<void> {
    await this.getEventById(eventId, churchId);
    await this.eventRepository.unregisterUser(eventId, userId);
  }
}