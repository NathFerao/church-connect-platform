import { Request, Response, NextFunction } from 'express';
import { PrayerService } from '../services/prayer.service';
import { successResponse, parseQueryParams } from '../utils/helpers';
import { getParam } from '../utils/params';

export class PrayerController {
  private prayerService: PrayerService;

  constructor() {
    this.prayerService = new PrayerService();
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = parseQueryParams(req.query);
      const result = await this.prayerService.getPrayerRequests(
        req.churchId!,
        req.user!.id,
        params
      );
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prayer = await this.prayerService.createPrayerRequest(
        req.body,
        req.user!.id,
        req.churchId!
      );
      res.status(201).json(successResponse(prayer, 'Prayer request created successfully'));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prayer = await this.prayerService.updatePrayerRequest(
        getParam(req, 'id'),
        req.body,
        req.user!.id,
        req.churchId!
      );
      res.json(successResponse(prayer, 'Prayer request updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  markAnswered = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prayer = await this.prayerService.markAsAnswered(
        getParam(req, 'id'),
        req.user!.id,
        req.churchId!
      );
      res.json(successResponse(prayer, 'Prayer request marked as answered'));
    } catch (error) {
      next(error);
    }
  };

  addPrayer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.prayerService.addPrayer(
        getParam(req, 'id'),
        req.user!.id,
        req.churchId!
      );
      res.json(successResponse(null, 'Prayer added successfully'));
    } catch (error) {
      next(error);
    }
  };

  removePrayer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.prayerService.removePrayer(
        getParam(req, 'id'),
        req.user!.id,
        req.churchId!
      );
      res.json(successResponse(null, 'Prayer removed successfully'));
    } catch (error) {
      next(error);
    }
  };
}