import { Request, Response, NextFunction } from 'express';
import { AnnouncementService } from '../services/announcement.service';
import { successResponse, parseQueryParams } from '../utils/helpers';
import { getParam } from '../utils/params';

export class AnnouncementController {
  private announcementService: AnnouncementService;

  constructor() {
    this.announcementService = new AnnouncementService();
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = parseQueryParams(req.query);
      const result = await this.announcementService.getAnnouncements(
        req.churchId!,
        req.user!.id,
        req.user!.role,
        params
      );
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const announcement = await this.announcementService.getAnnouncementById(
        getParam(req, 'id'),
        req.churchId!
      );
      res.json(successResponse(announcement));
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const announcement = await this.announcementService.createAnnouncement(
        req.body,
        req.user!.id,
        req.churchId!
      );
      res.status(201).json(successResponse(announcement, 'Announcement created successfully'));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const announcement = await this.announcementService.updateAnnouncement(
        getParam(req, 'id'),
        req.body,
        req.user!.id,
        req.user!.role,
        req.churchId!
      );
      res.json(successResponse(announcement, 'Announcement updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.announcementService.deleteAnnouncement(
        getParam(req, 'id'),
        req.user!.id,
        req.user!.role,
        req.churchId!
      );
      res.json(successResponse(null, 'Announcement deleted successfully'));
    } catch (error) {
      next(error);
    }
  };
}