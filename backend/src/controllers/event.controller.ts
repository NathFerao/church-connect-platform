import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/event.service';
import { successResponse, parseQueryParams } from '../utils/helpers';
import { getParam } from '../utils/params';
import { ForbiddenError } from '../utils/errors';

export class EventController {
  private getChurchId(req: Request): string {
  const churchId = req.user!.churchId;
  if (!churchId) throw new ForbiddenError('You must be assigned to a church');
  return churchId;
  }
  private eventService: EventService;

  constructor() {
    this.eventService = new EventService();
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = parseQueryParams(req.query);
      const result = await this.eventService.getEvents(this.getChurchId(req), params, req.user!.id);
      res.json(successResponse(result));
    } catch (error) { next(error); }
  };

  getUpcoming = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const events = await this.eventService.getUpcomingEvents(this.getChurchId(req));
      res.json(successResponse(events));
    } catch (error) { next(error); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = await this.eventService.getEventById(getParam(req, 'id'), this.getChurchId(req));
      res.json(successResponse(event));
    } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.eventService.createEvent(req.body, this.getChurchId(req));
      res.status(201).json(successResponse(result, 'Event created successfully'));
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = await this.eventService.updateEvent(getParam(req, 'id'), req.body, this.getChurchId(req));
      res.json(successResponse(event, 'Event updated successfully'));
    } catch (error) { next(error); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.eventService.deleteEvent(getParam(req, 'id'), this.getChurchId(req));
      res.json(successResponse(null, 'Event deleted successfully'));
    } catch (error) { next(error); }
  };

  // NEW: delete entire recurring series
  deleteSeries = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await this.eventService.deleteEventSeries(
        getParam(req, 'groupId'),
        this.getChurchId(req)
      );
      res.json(successResponse({ count }, `Deleted ${count} events in series`));
    } catch (error) { next(error); }
  };

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.eventService.registerForEvent(getParam(req, 'id'), req.user!.id, this.getChurchId(req));
      res.json(successResponse(null, 'Registered for event successfully'));
    } catch (error) { next(error); }
  };

  unregister = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.eventService.unregisterFromEvent(getParam(req, 'id'), req.user!.id, this.getChurchId(req));
      res.json(successResponse(null, 'Unregistered from event successfully'));
    } catch (error) { next(error); }
  };
}