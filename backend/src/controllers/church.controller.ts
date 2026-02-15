
import { Request, Response, NextFunction } from 'express';
import { ChurchService } from '../services/church.service';
import { successResponse } from '../utils/helpers';
import { getParam } from '../utils/params';

export class ChurchController {
  private churchService: ChurchService;

  constructor() {
    this.churchService = new ChurchService();
  }

  // GET /churches - List all churches (Super Admin only)
  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const churches = await this.churchService.getAllChurches();
      res.json(successResponse(churches));
    } catch (error) {
      next(error);
    }
  };

  // GET /churches/:id - Get single church
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const church = await this.churchService.getChurchById(getParam(req, 'id'));
      res.json(successResponse(church));
    } catch (error) {
      next(error);
    }
  };

  // POST /churches - Create new church (Super Admin only)
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.churchService.createChurch(req.body);
      res.status(201).json(successResponse(result, 'Church created successfully'));
    } catch (error) {
      next(error);
    }
  };

  // PUT /churches/:id - Update church (Church Admin or Super Admin)
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const church = await this.churchService.updateChurch(
        getParam(req, 'id'),
        req.body,
        req.user!.id,
        req.user!.role
      );
      res.json(successResponse(church, 'Church updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  // DELETE /churches/:id - Delete church (Super Admin only)
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.churchService.deleteChurch(
        getParam(req, 'id'),
        req.user!.role
      );
      res.json(successResponse(null, 'Church deleted successfully'));
    } catch (error) {
      next(error);
    }
  };

  // GET /churches/settings - Get current user's church settings
  getCurrentSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const church = await this.churchService.getCurrentChurchSettings(req.churchId!);
      res.json(successResponse(church));
    } catch (error) {
      next(error);
    }
  };

  // PUT /churches/settings - Update current user's church settings
  updateCurrentSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const church = await this.churchService.updateChurch(
        req.churchId!,
        req.body,
        req.user!.id,
        req.user!.role
      );
      res.json(successResponse(church, 'Church settings updated successfully'));
    } catch (error) {
      next(error);
    }
  };
}
